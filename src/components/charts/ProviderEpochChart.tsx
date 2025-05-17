/**
 * @file ProviderEpochChart.tsx
 * @description Displays rewards per epoch for a single provider using a bar chart.
 * @module components/charts/ProviderEpochChart
 */

"use client";

import React, { useMemo, useCallback, useEffect, useState } from "react";
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
} from "@/components/ui/chart"; // Use shadcn chart components
import { IEpochRewardData } from "@/api/types/xoxno-rewards.types";
import { cn } from "@/lib/utils/cn";
import { useChartAggregation } from "@/lib/hooks/useChartAggregation";
import { ChartTooltipWrapper, type ChartPayload } from "@/components/ui/chart/ChartTooltipWrapper";
import { calculateCumulativeData, precalculateEpochSums, calculateYDomain } from "@/lib/utils/chartUtils";
import { useStaking } from "@/lib/context/StakingContext";
import { DisplayMode } from "@/components/dashboard/ChartToggles";

/**
 * Format of a data entry for the epoch chart by wallet.
 * Each object represents an epoch, with rewards by wallet.
 * @example { epoch: 1234, 'erd1...': 1.23, 'erd1...2': 0.5 }
 */
export interface IWalletEpochChartData {
  epoch: number;
  [wallet: string]: number | string;
}

interface IProviderEpochChartProps {
  epochWalletData: IWalletEpochChartData[];
  providerName: string;
  chartType: "bar" | "line";
  displayMode: "daily" | "cumulative";
  className?: string;
  viewMode?: 'rewards' | 'staked';
}

/**
 * Reduces the number of data points for display
 * by aggregating nearby points based on container width
 */
function reduceDataPoints(
  data: IWalletEpochChartData[],
  targetPoints: number = 200 // Target number of points for smooth rendering
): IWalletEpochChartData[] {
  if (data.length <= targetPoints) return data;
  
  const step = Math.max(1, Math.floor(data.length / targetPoints));
  const result: IWalletEpochChartData[] = [];
  
  for (let i = 0; i < data.length; i += step) {
    const chunk = data.slice(i, i + step);
    const aggregated: IWalletEpochChartData = {
      epoch: chunk[0].epoch, // Keep the first epoch of the group
    };
    
    // Calculate the average for each wallet on this group of points
    chunk.forEach(point => {
      Object.entries(point).forEach(([key, value]) => {
        if (key === 'epoch') return;
        if (typeof value === 'number') {
          if (!aggregated[key]) aggregated[key] = 0;
          aggregated[key] = (aggregated[key] as number) + (value / chunk.length);
        }
      });
    });
    
    // Optimize numbers
    Object.entries(aggregated).forEach(([key, value]) => {
      if (key !== 'epoch' && typeof value === 'number') {
        aggregated[key] = Number(value.toFixed(6));
      }
    });
    
    result.push(aggregated);
  }
  
  return result;
}

/**
 * Renders a stacked chart showing EGLD rewards per epoch for a specific provider, split by wallet.
 */
export const ProviderEpochChart: React.FC<IProviderEpochChartProps> = ({
  epochWalletData,
  providerName,
  chartType,
  displayMode,
  className,
  viewMode = 'rewards',
}) => {
  // Add state to track displayMode changes
  const [prevDisplayMode, setPrevDisplayMode] = useState<DisplayMode>(displayMode);

  // Effect to detect and handle displayMode changes
  useEffect(() => {
    if (prevDisplayMode !== displayMode) {
      setPrevDisplayMode(displayMode);
    }
  }, [displayMode, prevDisplayMode, providerName]);
  
  // Use context to get colors
  const { state: { walletColorMap } } = useStaking();

  // If no data, display a message
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

  // List of wallets (stable order)
  const wallets = useMemo(() => {
    return Object.keys(walletColorMap);
  }, [walletColorMap]);

  // Pre-calculate sums by epoch (direct calculation)
  const processedData = useMemo(() => {
    return precalculateEpochSums(epochWalletData, wallets);
  }, [epochWalletData, wallets, providerName]);

  // Calculate cumulative data (direct calculation)
  const cumulativeData = useMemo(() => {
    return calculateCumulativeData(processedData, wallets);
  }, [processedData, wallets, providerName]);

  // Pre-calculate totals for cumulative data (direct calculation)
  const processedCumulativeData = useMemo(() => {
    return precalculateEpochSums(cumulativeData, wallets);
  }, [cumulativeData, wallets, providerName]);

  // Select data based on display mode
  const displayData = useMemo(() => {
    return displayMode === "cumulative" ? processedCumulativeData : processedData;
  }, [displayMode, processedCumulativeData, processedData, providerName]);

  // Calculate Y-axis limits (direct calculation)
  const yDomain = useMemo(() => {
    return calculateYDomain(displayData, displayMode, wallets);
  }, [displayData, displayMode, wallets, providerName]);

  // Y-axis formatter
  const yTickFormatter = useCallback((value: any) => {
    if (typeof value !== 'number') return '';
    // Adjust decimal places based on maximum value
    const maxValue = yDomain[1];
    const decimals = maxValue < 0.1 ? 4 : maxValue < 1 ? 3 : maxValue < 10 ? 2 : maxValue < 100 ? 1 : 0;
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }, [yDomain]);

  // Choose parent component
  const ChartComponent = chartType === "bar" ? BarChart : AreaChart;

  // Reduce the number of points for display
  const optimizedDisplayData = useMemo(() => {
    return reduceDataPoints(displayData);
  }, [displayData]);

  // Memoize common styles to avoid recalculations
  const chartStyles = useMemo(() => ({
    cartesianGrid: {
      vertical: false,
      strokeDasharray: "3 3",
      stroke: "hsl(var(--border) / 0.5)"
    },
    xAxis: {
      tickLine: false,
      axisLine: false,
      tickMargin: 8,
      fontSize: 10,
      minTickGap: 60
    },
    yAxis: {
      tickLine: false,
      axisLine: false,
      tickMargin: 8,
      fontSize: 10,
      width: 80
    }
  }), []);

  // Memoize chart components for each wallet
  const chartElements = useMemo(() => {
    const elements = wallets.map(wallet => {
      const color = walletColorMap[wallet];
      if (chartType === "bar") {
        return (
          <Bar
            key={wallet}
            dataKey={wallet}
            fill={color}
            stackId="stack"
          />
        );
      } else {
        return (
          <Area
            key={wallet}
            dataKey={wallet}
            stroke={color}
            fill={color}
            fillOpacity={0.5}
            stackId="stack"
          />
        );
      }
    });
    return elements;
  }, [wallets, walletColorMap, chartType]);

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
              data={optimizedDisplayData}
              margin={{
                top: 10,
                right: 10,
                left: 5,
                bottom: 15
              }}
              barGap={chartType === "bar" ? 2 : undefined}
            >
              <CartesianGrid {...chartStyles.cartesianGrid} />
              <XAxis 
                dataKey="epoch"
                {...chartStyles.xAxis}
              />
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
                    viewMode={viewMode}
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
