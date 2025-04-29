/**
 * @file GlobalEpochChart.tsx
 * @description Displays aggregated epoch rewards across all providers.
 * @module components/charts/GlobalEpochChart
 */

'use client';

import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    BarChart,
    Bar,
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
import { useChartAggregation, ProcessedChartDataPoint } from "@/lib/hooks/useChartAggregation";
import { ChartTooltipContent as NewChartTooltipContent } from "@/components/ui/chart/ChartTooltipContent";
import { ChartTooltipWrapper } from "@/components/ui/chart/ChartTooltipWrapper";

interface IGlobalEpochChartProps {
    aggregatedEpochData: IAggregatedEpochData[] | undefined;
    epochWalletData: Array<{ epoch: number; [wallet: string]: number }>;
    walletColorMap: Record<string, string>;
    chartType: 'bar' | 'line';
    className?: string;
}

/**
 * Renders an area chart showing aggregated EGLD rewards per epoch across all providers.
 */
export const GlobalEpochChart: React.FC<IGlobalEpochChartProps> = ({
    aggregatedEpochData,
    epochWalletData,
    walletColorMap,
    chartType,
    className,
}) => {
    // Use the aggregation hook, passing 'totalReward' as the key
    // We need to map aggregatedEpochData slightly first to fit the hook's expected input shape { epoch, value }
    const preProcessedData = useMemo(() => {
        if (!aggregatedEpochData) return undefined;
        return aggregatedEpochData.map(d => ({ epoch: d.epoch, value: d.totalReward }));
    }, [aggregatedEpochData]);

    const processedChartData: ProcessedChartDataPoint[] = useChartAggregation(preProcessedData, 'value');

    // Si pas de données, afficher un message
    if (!epochWalletData || epochWalletData.length === 0) {
        return (
            <div className={cn("text-center text-muted-foreground text-sm py-8", className)}>
                No global epoch data available.
            </div>
        );
    }

    // Récupérer la liste des wallets à partir du mapping couleur (ordre stable)
    const wallets = Object.keys(walletColorMap);

    // Déterminer la valeur max pour le Y (somme des rewards par epoch)
    const maxY = Math.max(
        ...epochWalletData.map(d => wallets.reduce((sum, w) => sum + (d[w] || 0), 0))
    );
    const buffer = maxY * 0.2; // Toujours 20% de la valeur maximale
    const yDomain: [number | string, number | string] = [0, maxY + buffer];

    // Choisir le composant parent
    const ChartComponent = chartType === 'bar' ? BarChart : AreaChart;

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
                        bottom: 15,
                    }}
                    barGap={chartType === 'bar' ? 2 : undefined}
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
                        minTickGap={80}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={10}
                        domain={yDomain}
                        tickFormatter={(value) => {
                            if (typeof value !== 'number') return '';
                            // Adapter le nombre de décimales selon la valeur max
                            const decimals = maxY < 0.1 ? 4 : maxY < 1 ? 3 : maxY < 10 ? 2 : maxY < 100 ? 1 : 0;
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
                        chartType === 'bar' ? (
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