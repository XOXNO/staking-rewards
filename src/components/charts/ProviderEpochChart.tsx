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
  className?: string;
}

/**
 * Renders a stacked chart showing EGLD rewards per epoch for a specific provider, split by wallet.
 */
export const ProviderEpochChart: React.FC<IProviderEpochChartProps> = ({
  epochWalletData,
  walletColorMap,
  providerName,
  chartType,
  className,
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
        No epoch data available for {providerName}.
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

  // Déterminer la valeur max pour le Y (somme des rewards par epoch)
  const maxY = Math.max(
    ...epochWalletData.map(d => wallets.reduce((sum, w) => sum + Number(d[w] || 0), 0))
  );
  const buffer = maxY * 0.2; // Toujours 20% de la valeur maximale
  const yDomain: [number | string, number | string] = [0, maxY + buffer];

  // Déterminer la valeur max pour le Y cumulatif
  const maxYCumulative = Math.max(
    ...cumulativeData.map(d => wallets.reduce((sum, w) => sum + Number(d[w] || 0), 0))
  );
  const bufferCumulative = maxYCumulative * 0.1;
  const yDomainCumulative: [number | string, number | string] = [0, maxYCumulative + bufferCumulative];

  // Choisir le composant parent
  const ChartComponent = chartType === "bar" ? BarChart : AreaChart;

  const renderChart = (data: typeof epochWalletData, yDomainValues: [number | string, number | string], height: string) => (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent
        accessibilityLayer
        data={data}
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
          domain={yDomainValues}
          tickFormatter={(value) => {
            if (typeof value !== 'number') return '';
            // Adapter le nombre de décimales selon la valeur max
            const maxValue = yDomainValues[1] as number;
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
  );

  return (
    <ChartContainer
      config={{}}
      className={cn("h-[450px] w-full", className)}
    >
      <div className="w-full h-full flex flex-col space-y-4 p-2">
        {/* Graphique par epoch */}
        <div className="flex-1 min-h-0">
          <div className="text-xs text-muted-foreground mb-1">Rewards per epoch</div>
          <div className="h-[180px]">
            {renderChart(epochWalletData, yDomain, "100%")}
          </div>
        </div>
        
        {/* Graphique cumulatif */}
        <div className="flex-1 min-h-0">
          <div className="text-xs text-muted-foreground mb-1">Cumulative rewards</div>
          <div className="h-[180px]">
            {renderChart(cumulativeData, yDomainCumulative, "100%")}
          </div>
        </div>
      </div>
    </ChartContainer>
  );
};
