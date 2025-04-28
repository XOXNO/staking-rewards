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

  // Déterminer la valeur max pour le Y (somme des rewards par epoch)
  const maxY = Math.max(
    ...epochWalletData.map(d => wallets.reduce((sum, w) => sum + Number(d[w] || 0), 0))
  );
  const buffer = Math.max(maxY * 0.1, 0.5);
  const yDomain: [number | string, number | string] = [0, `dataMax + ${buffer}`];

  // Choisir le composant parent
  const ChartComponent = chartType === "bar" ? BarChart : AreaChart;

  return (
    <ChartContainer
      config={{}}
      className={cn("min-h-[250px] h-[250px] w-full", className)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent
          accessibilityLayer
          data={epochWalletData}
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
              return value.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 1
              });
            }}
            allowDecimals={true}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const epoch = payload && payload[0] && payload[0].payload && payload[0].payload.epoch;
                  return epoch !== undefined ? `Epoch ${epoch}` : 'Epoch ?';
                }}
                formatter={(value, name) => `${formatEgld(value as number)} (${name})`}
                indicator="dot"
              />
            }
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
    </ChartContainer>
  );
};
