/**
 * @file ProviderEpochChart.tsx
 * @description Displays rewards per epoch for a single provider using a bar chart.
 * @module components/charts/ProviderEpochChart
 */

"use client";

import React, { useMemo, useCallback, useRef } from "react";
import { useContainerDimensions } from "@/hooks/useContainerDimensions";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartTooltip,
} from "@/components/ui/chart"; // Use shadcn chart components
import { cn } from "@/lib/utils/cn";
import {
  ChartTooltipWrapper,
  type ChartPayload,
} from "@/components/ui/chart/ChartTooltipWrapper";
import {
  calculateCumulativeData,
  precalculateEpochSums,
  calculateYDomain,
  aggregateByGranularity,
} from "@/lib/utils/chartUtils";
import { useStaking } from "@/lib/context/StakingContext";
import { CurrencyMode } from "@/components/dashboard/ChartToggles";

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
  currencyMode: CurrencyMode;
  granularity?: number;
  walletColorMap?: Record<string, string>;
  className?: string;
  viewMode?: "rewards" | "staked";
}

/**
 * Renders a stacked chart showing EGLD rewards per epoch for a specific provider, split by wallet.
 */
export const ProviderEpochChart: React.FC<IProviderEpochChartProps> = ({
  epochWalletData,
  providerName,
  chartType,
  displayMode,
  currencyMode,
  granularity = 1,
  walletColorMap: propWalletColorMap,
  className,
  viewMode = "rewards",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerDimensions(containerRef);

  // Use context to get colors as fallback
  const {
    state: { walletColorMap: contextWalletColorMap },
  } = useStaking();

  // Prefer prop over context
  const walletColorMap = propWalletColorMap || contextWalletColorMap;

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

  // Aggregate data by granularity
  const optimizedDisplayData = useMemo(() => {
    return aggregateByGranularity(
      displayData,
      granularity,
      wallets,
      displayMode === "cumulative"
    );
  }, [displayData, granularity, wallets, displayMode]);

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
        style: currencyMode === 'usd' ? 'currency' : 'decimal',
        currency: currencyMode === 'usd' ? 'USD' : undefined,
      });
    },
    [yDomain, currencyMode]
  );

  // Choose parent component
  const ChartComponent = chartType === "bar" ? BarChart : AreaChart;

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
        {viewMode === "staked"
          ? `No staked amount data available for ${providerName}.`
          : `No epoch data available for ${providerName}.`}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("w-full overflow-hidden", className)} style={{ minHeight: 450 }}>
      <ChartComponent
        key={`chart-${granularity}-${displayMode}-${chartType}-${optimizedDisplayData.length}`}
        width={width}
        height={450}
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
              viewMode={viewMode}
              currencyMode={currencyMode}
            />
          )}
        />
        {chartElements}
      </ChartComponent>
    </div>
  );
};
