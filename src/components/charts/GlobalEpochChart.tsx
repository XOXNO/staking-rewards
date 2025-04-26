/**
 * @file GlobalEpochChart.tsx
 * @description Displays aggregated epoch rewards across all providers.
 * @module components/charts/GlobalEpochChart
 */

'use client';

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { IAggregatedEpochData } from '@/types/dashboard'; // Assuming type exists
import { cn } from '@/lib/utils/cn';
import { formatEgld } from '@/lib/utils/formatters';

interface IGlobalEpochChartProps {
    aggregatedEpochData: IAggregatedEpochData[] | undefined;
    className?: string;
}

/**
 * Renders an area chart showing aggregated EGLD rewards per epoch across all providers.
 */
export const GlobalEpochChart: React.FC<IGlobalEpochChartProps> = ({
    aggregatedEpochData,
    className,
}) => {
    if (!aggregatedEpochData || aggregatedEpochData.length === 0) {
        return (
            <div className={cn("text-center text-muted-foreground text-sm py-8", className)}>
                No global epoch data available.
            </div>
        );
    }

    // Chart config for the global view
    const chartConfig = {
        totalReward: {
            label: "Total EGLD Reward",
            color: "hsl(142.1, 76.2%, 36.3%)", // Use a distinct color, e.g., green
        },
    } satisfies ChartConfig;

    // Determine max value for setting upper bound buffer
    const rewards = aggregatedEpochData.map(d => d.totalReward);
    const maxY = rewards.length > 0 ? Math.max(...rewards) : 0;
    const buffer = Math.max(maxY * 0.1, 1); // 10% buffer or at least 1 EGLD
    const yDomain: [number | string, number | string] = [0, `dataMax + ${buffer}`];

    const gradientId = "fill-global-reward";

    return (
        <ChartContainer
            config={chartConfig}
            className={cn("min-h-[250px] w-full", className)} // Removed h-full here as well
        >
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    accessibilityLayer
                    data={aggregatedEpochData}
                    margin={{
                        top: 10,
                        right: 10,
                        left: 5,
                        bottom: 15, // Increased bottom margin
                    }}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor="var(--color-totalReward)"
                                stopOpacity={0.8}
                            />
                            <stop
                                offset="95%"
                                stopColor="var(--color-totalReward)"
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
                        minTickGap={80} // Increased min gap
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={10}
                        // Remove fixed width: width={70}
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
                                labelFormatter={(label) => `Epoch ${label}`}
                                formatter={(value) => formatEgld(value as number)}
                                indicator="dot"
                            />
                        }
                    />
                    <Area
                        dataKey="totalReward"
                        type="natural"
                        fill={`url(#${gradientId})`}
                        stroke="var(--color-totalReward)"
                        strokeWidth={2}
                        dot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
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