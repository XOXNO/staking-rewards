/**
 * @file ProviderEpochChart.tsx
 * @description Displays rewards per epoch for a single provider using a bar chart.
 * @module components/charts/ProviderEpochChart
 */

"use client";

import React from "react";
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

interface IProviderEpochChartProps {
  epochData: IEpochRewardData[] | undefined;
  providerName: string;
  activeAddress: string; // Needed to determine owner rewards
  providerOwnerAddress: string;
  chartType: "bar" | "line";
  className?: string;
}

/**
 * Renders a bar chart showing EGLD rewards per epoch for a specific provider.
 */
export const ProviderEpochChart: React.FC<IProviderEpochChartProps> = ({
  epochData,
  providerName,
  activeAddress,
  providerOwnerAddress,
  chartType,
  className,
}) => {
  if (!epochData || epochData.length === 0) {
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

  const isOwner = activeAddress === providerOwnerAddress;
  const MAX_POINTS_BEFORE_AGGREGATION = 100; // Threshold for aggregation
  const AGGREGATION_INTERVAL = 7; // Aggregate weekly

  // Prepare data for the chart
  const sortedEpochs = [...(epochData ?? [])].sort((a, b) => a.epoch - b.epoch);

  let processedChartData: Array<{
    epoch: number | string;
    reward: number;
    label?: string;
  }>;

  if (sortedEpochs.length > MAX_POINTS_BEFORE_AGGREGATION) {
    // Aggregate data
    processedChartData = [];
    for (let i = 0; i < sortedEpochs.length; i += AGGREGATION_INTERVAL) {
      const chunk = sortedEpochs.slice(i, i + AGGREGATION_INTERVAL);
      if (chunk.length === 0) continue;

      const totalChunkReward = chunk.reduce((sum, epoch) => {
        return (
          sum + epoch.epochUserRewards + (isOwner ? epoch.ownerRewards : 0)
        );
      }, 0);
      const avgReward = totalChunkReward / chunk.length;
      const startEpoch = chunk[0].epoch;
      const endEpoch = chunk[chunk.length - 1].epoch;

      processedChartData.push({
        epoch: startEpoch, // Use start epoch for positioning
        reward: avgReward,
        label: `Epochs ${startEpoch}-${endEpoch} (Avg)`, // Label for tooltip
      });
    }
  } else {
    // Use raw data
    processedChartData = sortedEpochs.map((epoch) => ({
      epoch: epoch.epoch,
      reward: epoch.epochUserRewards + (isOwner ? epoch.ownerRewards : 0),
    }));
  }

  // Define chart config with new color
  const chartConfig = {
    reward: {
      label: "EGLD Reward",
      // Use a vibrant blue - adjust HSL as needed
      color: "hsl(210, 90%, 55%)", // Electronic Blue (example)
    },
  } satisfies ChartConfig;

  // Determine max value for setting upper bound buffer
  const rewards = processedChartData.map(d => d.reward);
  const maxY = rewards.length > 0 ? Math.max(...rewards) : 0;
  const buffer = Math.max(maxY * 0.1, 0.5); // 10% buffer or at least 0.5

  // Set lower domain to 0, let Recharts handle upper bound with a buffer
  const yDomain: [number | string, number | string] = [
    0, // Start Y-axis at 0
    `dataMax + ${buffer}` // Let Recharts calculate max + buffer
  ];

  // Generate a unique ID for the gradient fill (needed again)
  const gradientId = `fill-reward-${providerName.replace(/\s+/g, "-")}`;

  // Choose the correct parent chart component
  const ChartComponent = chartType === "bar" ? BarChart : AreaChart;

  return (
    <ChartContainer
      config={chartConfig}
      className={cn("min-h-[250px] w-full h-full", className)}
    >
      <ResponsiveContainer width="100%" height="100%">
        {/* Use the dynamic ChartComponent */}
        <ChartComponent
          accessibilityLayer
          data={processedChartData}
          margin={{
            top: 10,
            right: 10,
            left: 5,
            bottom: 15 // Ensure enough space for X-axis
          }}
          barGap={
            chartType === "bar"
              ? processedChartData.length > MAX_POINTS_BEFORE_AGGREGATION
                ? 0
                : 2
              : undefined
          }
        >
          {/* Define gradient for Area fill */}
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              {/* Use var(--color-reward) which is set by ChartContainer based on config */}
              <stop
                offset="5%"
                stopColor="var(--color-reward)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-reward)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>

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
                // Use custom label if available (from aggregated data), else format epoch number
                labelFormatter={(label, payload) =>
                  payload?.[0]?.payload?.label || `Epoch ${label}`
                }
                formatter={(value) => formatEgld(value as number)}
                indicator="dot"
              />
            }
          />

          {/* Conditional Rendering: Bar or Area */}
          {chartType === "bar" ? (
            <Bar
              dataKey="reward"
              fill="var(--color-reward)"
              radius={
                processedChartData.length > MAX_POINTS_BEFORE_AGGREGATION
                  ? 0
                  : 2
              }
            />
          ) : (
            <Area
              dataKey="reward"
              type="natural"
              fill={`url(#${gradientId})`} // Re-add gradient fill
              stroke="var(--color-reward)" // Use the config color variable
              strokeWidth={2}
              dot={false}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
