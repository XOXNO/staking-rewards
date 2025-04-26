/**
 * @file GlobalDashboardView.tsx
 * @description Displays aggregated statistics and charts for all providers.
 * @module components/dashboard/GlobalDashboardView
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils/cn';
import { formatEgld } from '@/lib/utils/formatters';
import { IGlobalStats, IAggregatedEpochData } from '@/types/dashboard'; // Assuming types exist
import { GlobalEpochChart } from '@/components/charts';

interface IGlobalDashboardViewProps {
    globalStats: IGlobalStats;
    aggregatedEpochData: IAggregatedEpochData[];
    className?: string;
}

/**
 * Displays an overview dashboard aggregating data across all providers.
 */
export const GlobalDashboardView: React.FC<IGlobalDashboardViewProps> = ({
    globalStats,
    aggregatedEpochData,
    className,
}) => {
    // TODO: Implement detailed layout with stats and chart
    return (
        <div className={cn('flex flex-col space-y-6 p-4 md:p-6 h-full', className)}>
            <h2 className="text-2xl font-bold">All Providers Overview</h2>

            {/* Stats Section */}
            <Card className="bg-card/80 border-border/50 flex-shrink-0">
                <CardHeader>
                    <CardTitle>Global Statistics</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 text-sm">
                    {/* Total Column */}
                    <div className="sm:col-span-2 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-border/50 pb-4 lg:pb-0 lg:pr-6">
                        <p className="text-muted-foreground mb-1">Total Rewarded (All Providers)</p>
                        <p className="text-xl font-semibold font-mono">{formatEgld(globalStats.totalRewards)}</p>
                    </div>
                    {/* 7 Day Column */}
                    <div className="border-b sm:border-b-0 sm:border-r lg:border-r border-border/50 pb-4 sm:pb-0 sm:pr-6">
                        <p className="text-muted-foreground mb-2 font-medium">Last 7 Epochs (Global)</p>
                        <div className="flex justify-between"><span className="text-muted-foreground">Avg:</span> <span className="font-mono">{formatEgld(globalStats.avg7)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Min:</span> <span className="font-mono">{formatEgld(globalStats.minMax7.min)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Max:</span> <span className="font-mono">{formatEgld(globalStats.minMax7.max)}</span></div>
                    </div>
                    {/* 30 Day Column */}
                    <div>
                        <p className="text-muted-foreground mb-2 font-medium">Last 30 Epochs (Global)</p>
                        <div className="flex justify-between"><span className="text-muted-foreground">Avg:</span> <span className="font-mono">{formatEgld(globalStats.avg30)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Min:</span> <span className="font-mono">{formatEgld(globalStats.minMax30.min)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Max:</span> <span className="font-mono">{formatEgld(globalStats.minMax30.max)}</span></div>
                    </div>
                </CardContent>
            </Card>

            {/* Chart Section */}
            <Card className="bg-card/80 border-border/50 flex flex-col flex-grow overflow-hidden">
                <CardHeader>
                    <CardTitle>Global Epoch Rewards</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow p-2">
                    <GlobalEpochChart 
                        aggregatedEpochData={aggregatedEpochData}
                        className="h-full" />
                </CardContent>
            </Card>
        </div>
    );
}; 