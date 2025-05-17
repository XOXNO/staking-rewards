/**
 * @file GlobalEpochChart.tsx
 * @description Displays the global chart of rewards per epoch across all providers.
 * @module components/charts/GlobalEpochChart
 */

"use client";

import React, { useEffect, useMemo, useCallback, useState } from "react";
import {
  AreaChart,
  BarChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useStaking } from "@/lib/context/StakingContext";
import { cn } from "@/lib/utils/cn";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  ChartTooltipWrapper,
  type ChartPayload,
} from "@/components/ui/chart/ChartTooltipWrapper";
import { IAggregatedEpochData } from "@/types/dashboard";
import {
  calculateCumulativeData,
  precalculateEpochSums,
  calculateYDomain,
} from "@/lib/utils/chartUtils";
import { DisplayMode } from "@/components/dashboard/ChartToggles";

interface IGlobalEpochChartProps {
  aggregatedEpochData: IAggregatedEpochData[] | undefined;
  epochWalletData: Array<{ epoch: number; [wallet: string]: number }>;
  chartType: "bar" | "line";
  displayMode: "daily" | "cumulative";
  className?: string;
}

/**
 * Reduces the number of data points for more efficient rendering
 */
function reduceDataPoints(
  data: Array<{ epoch: number; [wallet: string]: number | string }>,
  targetPoints: number = 200
): Array<{ epoch: number; [wallet: string]: number | string }> {
  if (data.length <= targetPoints) return data;

  const step = Math.ceil(data.length / targetPoints);
  const result = [];

  for (let i = 0; i < data.length; i += step) {
    const chunk = data.slice(i, i + step);
    const aggregated: { epoch: number; [wallet: string]: number | string } = {
      epoch: chunk[0].epoch,
    };

    // Calculate the average for each wallet on this group of points
    chunk.forEach((point) => {
      Object.entries(point).forEach(([key, value]) => {
        if (key === "epoch") return;
        if (typeof value === "number") {
          if (!aggregated[key]) aggregated[key] = 0;
          aggregated[key] = (aggregated[key] as number) + value / chunk.length;
        }
      });
    });

    // Optimize numbers
    Object.entries(aggregated).forEach(([key, value]) => {
      if (key !== "epoch" && typeof value === "number") {
        aggregated[key] = Number(value.toFixed(6));
      }
    });

    result.push(aggregated);
  }

  return result;
}

/**
 * Renders an area chart showing aggregated EGLD rewards per epoch across all providers.
 */
export const GlobalEpochChart: React.FC<IGlobalEpochChartProps> = ({
  epochWalletData,
  chartType,
  displayMode,
  className,
}) => {
  // Add a state to track displayMode changes
  const [prevDisplayMode, setPrevDisplayMode] =
    useState<DisplayMode>(displayMode);

  // Effect to detect and handle displayMode changes
  useEffect(() => {
    if (prevDisplayMode !== displayMode) {
      setPrevDisplayMode(displayMode);
    }
  }, [displayMode, prevDisplayMode]);

  // Use context to get colors
  const {
    state: { walletColorMap },
  } = useStaking();

  // List of wallets (stable order)
  const wallets = useMemo(() => {
    return Object.keys(walletColorMap);
  }, [walletColorMap]);

  // Pre-calculate sums by epoch (direct calculation)
  const processedData = useMemo(() => {
    return precalculateEpochSums(epochWalletData, wallets);
  }, [epochWalletData, wallets]);

  // Calculate cumulative data
  const cumulativeData = useMemo(() => {
    return calculateCumulativeData(processedData, wallets);
  }, [processedData, wallets]);

  // Pre-calculate totals for cumulative data
  const processedCumulativeData = useMemo(() => {
    return precalculateEpochSums(cumulativeData, wallets);
  }, [cumulativeData, wallets]);

  // Select data based on display mode
  const displayData = useMemo(() => {
    return displayMode === "cumulative"
      ? processedCumulativeData
      : processedData;
  }, [displayMode, processedCumulativeData, processedData]);

  // Reduce the number of points for display
  const optimizedDisplayData = useMemo(() => {
    return reduceDataPoints(displayData);
  }, [displayData]);

  // Calculate Y-axis limits
  const yDomain = useMemo(() => {
    return calculateYDomain(optimizedDisplayData, displayMode, wallets);
  }, [optimizedDisplayData, displayMode, wallets]);

  // Y-axis formatter
  const yTickFormatter = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value: any) => {
      if (typeof value !== "number") return "";
      const maxValue = yDomain[1];
      const decimals =
        maxValue < 0.1
          ? 4
          : maxValue < 1
          ? 3
          : maxValue < 10
          ? 2
          : maxValue < 100
          ? 1
          : 0;
      return value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    },
    [yDomain]
  );

  // Memoize common styles
  const chartStyles = useMemo(
    () => ({
      cartesianGrid: {
        vertical: false,
        strokeDasharray: "3 3",
        stroke: "hsl(var(--border) / 0.5)",
      },
      xAxis: {
        tickLine: false,
        axisLine: false,
        tickMargin: 8,
        fontSize: 10,
        minTickGap: 80,
      },
      yAxis: {
        tickLine: false,
        axisLine: false,
        tickMargin: 8,
        fontSize: 10,
        width: 80,
      },
    }),
    []
  );

  // Memoize chart components
  const chartElements = useMemo(() => {
    const elements = wallets.map((wallet) => {
      const color = walletColorMap[wallet];
      if (chartType === "bar") {
        return (
          <Bar
            key={wallet}
            dataKey={wallet}
            stackId="stack"
            fill={color}
            name={wallet}
            radius={2}
            isAnimationActive={false}
          />
        );
      } else {
        return (
          <Area
            key={wallet}
            dataKey={wallet}
            stackId="stack"
            type="natural"
            fill={color}
            stroke={color}
            fillOpacity={0.5}
            strokeWidth={2}
            dot={false}
            name={wallet}
            isAnimationActive={false}
          />
        );
      }
    });
    return elements;
  }, [wallets, walletColorMap, chartType]);

  // If no data, display a message
  if (!epochWalletData || epochWalletData.length === 0) {
    return (
      <div
        className={cn(
          "text-center text-muted-foreground text-sm py-8",
          className
        )}
      >
        No global epoch data available.
      </div>
    );
  }

  // Choose parent component
  const ChartComponent = chartType === "bar" ? BarChart : AreaChart;

  return (
    <ChartContainer config={{}} className={cn("h-[450px] w-full", className)}>
      <div className="w-full h-full p-2">
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent
              accessibilityLayer
              data={optimizedDisplayData}
              margin={{
                top: 10,
                right: 10,
                left: 5,
                bottom: 15,
              }}
              barGap={chartType === "bar" ? 2 : undefined}
            >
              <CartesianGrid {...chartStyles.cartesianGrid} />
              <XAxis dataKey="epoch" {...chartStyles.xAxis} />
              <YAxis
                {...chartStyles.yAxis}
                tickFormatter={yTickFormatter}
                domain={yDomain}
              />
              <ChartTooltip
                content={({ active, payload }) => (
                  <ChartTooltipWrapper
                    active={active}
                    payload={payload as unknown as ChartPayload[]}
                    walletColorMap={walletColorMap}
                    displayMode={displayMode}
                    viewMode="rewards"
                  />
                )}
              />
              {chartElements}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartContainer>
  );
};

// Need to define the types used (or import them)
// Create src/types/dashboard.ts if it doesn't exist
/**
 * @file src/types/dashboard.ts
 * @description Shared types for dashboard components.
 */
/*
export interface IGlobalStats {
    totalRewards: number;
    avg7: number;
    avg30: number;
    minMax7: { min: number; max: number };
    minMax30: { min: number; max: number };
}

export interface IAggregatedEpochData {
    epoch: number;
    totalReward: number;
}
*/
