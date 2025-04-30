/**
 * @file ProviderEpochChart.tsx
 * @description Displays rewards per epoch for a single provider using a bar chart.
 * @module components/charts/ProviderEpochChart
 */

"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"; // Use shadcn chart components
import { IEpochRewardData } from "@/api/types/xoxno-rewards.types";
import { cn } from "@/lib/utils/cn";
import { formatEgld } from "@/lib/utils/formatters"; // Import from utils
import { useChartAggregation, ProcessedChartDataPoint } from "@/lib/hooks/useChartAggregation";
import { ChartTooltipContent as NewChartTooltipContent } from "@/components/ui/chart/ChartTooltipContent";
import { ChartTooltipWrapper } from "@/components/ui/chart/ChartTooltipWrapper";
import { calculateCumulativeData } from "@/lib/utils/chartUtils";

/**
 * Format d'une entrée de données pour le graphique d'epochs par wallet.
 * Chaque objet représente un epoch, avec les rewards par wallet.
 * @example { epoch: 1234, 'erd1...': 1.23, 'erd1...2': 0.5 }
 */
export interface IWalletEpochChartData {
  epoch: number;
  [wallet: string]: number | string;
}

interface IProviderEpochChartProps {
  epochWalletData: IWalletEpochChartData[];
  walletColorMap: Record<string, string>;
  providerName: string;
  chartType: "bar" | "line";
  displayMode: "daily" | "cumulative";
  className?: string;
  viewMode?: 'rewards' | 'staked';
}

/**
 * Renders a stacked chart showing EGLD rewards per epoch for a specific provider, split by wallet.
 */
export const ProviderEpochChart: React.FC<IProviderEpochChartProps> = ({
  epochWalletData,
  walletColorMap,
  providerName,
  chartType,
  displayMode,
  className,
  viewMode = 'rewards',
}) => {
  // Si pas de données, afficher un message
  if (!epochWalletData || epochWalletData.length === 0) {
    return (
      <div
        className={cn(
          "text-center text-muted-foreground text-sm py-8",
          className
        )}
      >
        {viewMode === 'staked'
          ? `No staked amount data available for ${providerName}.`
          : `No epoch data available for ${providerName}.`}
      </div>
    );
  }

  // Liste des wallets (ordre stable)
  const wallets = Object.keys(walletColorMap);

  // Calculer les données cumulatives
  const cumulativeData = useMemo(() => 
    calculateCumulativeData(epochWalletData, wallets),
    [epochWalletData, wallets]
  );

  // Sélectionner les données selon le mode d'affichage
  const displayData = displayMode === "cumulative" ? cumulativeData : epochWalletData;

  // Déterminer la valeur max pour le Y selon le mode d'affichage
  const maxY = Math.max(
    ...displayData.map(d => wallets.reduce((sum, w) => sum + Number(d[w] || 0), 0))
  );
  const buffer = maxY * (displayMode === "cumulative" ? 0.1 : 0.2);
  const yDomain: [number | string, number | string] = [0, maxY + buffer];

  // Choisir le composant parent
  const ChartComponent = chartType === "bar" ? BarChart : AreaChart;

  return (
    <ChartContainer
      config={{}}
      className={cn("h-[450px] w-full", className)}
    >
      <div className="w-full h-full p-2">
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent
              accessibilityLayer
              data={displayData}
              margin={{
                top: 10,
                right: 10,
                left: 5,
                bottom: 15
              }}
              barGap={chartType === "bar" ? 2 : undefined}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="hsl(var(--border) / 0.5)"
              />
              <XAxis
                dataKey="epoch"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={10}
                minTickGap={60}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={10}
                width={70}
                domain={yDomain}
                tickFormatter={(value) => {
                  if (typeof value !== 'number') return '';
                  // Adapter le nombre de décimales selon la valeur max
                  const maxValue = yDomain[1] as number;
                  const decimals = maxValue < 0.1 ? 4 : maxValue < 1 ? 3 : maxValue < 10 ? 2 : maxValue < 100 ? 1 : 0;
                  return value.toLocaleString(undefined, {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                  });
                }}
                allowDecimals={true}
              />
              <ChartTooltip
                cursor={false}
                content={ChartTooltipWrapper({ walletColorMap })}
              />
              {/* Afficher une série par wallet */}
              {wallets.map(wallet =>
                chartType === "bar" ? (
                  <Bar
                    key={wallet}
                    dataKey={wallet}
                    stackId="a"
                    fill={walletColorMap[wallet]}
                    name={wallet}
                    radius={2}
                    isAnimationActive={false}
                  />
                ) : (
                  <Area
                    key={wallet}
                    dataKey={wallet}
                    stackId="a"
                    type="natural"
                    fill={walletColorMap[wallet]}
                    stroke={walletColorMap[wallet]}
                    strokeWidth={2}
                    dot={false}
                    name={wallet}
                    isAnimationActive={false}
                  />
                )
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartContainer>
  );
};
