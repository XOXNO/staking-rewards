/**
 * @file GlobalDashboardView.tsx
 * @description Displays aggregated statistics and charts for all providers.
 * @module components/dashboard/GlobalDashboardView
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from '@/lib/utils/cn';
import { formatEgld } from '@/lib/utils/formatters';
import { IGlobalStats, IAggregatedEpochData } from '@/types/dashboard'; // Assuming types exist
import { GlobalEpochChart, GlobalStakedChart } from '@/components/charts';
import { ChartToggles, type ChartType, type DisplayMode, type ViewMode } from './ChartToggles';
import { WalletPercentBar } from './WalletPercentBar';
import { FunLoadingMessages } from '@/components/ui/FunLoadingMessages';
import { EpochStats } from '@/components/dashboard/EpochStats';
import type { IEpochStats } from '@/components/dashboard/EpochStats';

interface IGlobalDashboardViewProps {
    globalStats: IGlobalStats;
    aggregatedEpochData: IAggregatedEpochData[];
    epochWalletData: Array<{ epoch: number; [wallet: string]: number }>;
    stakingData: Array<{ epoch: number; [wallet: string]: number }>;  // Staking data by epoch and by wallet
    walletColorMap: Record<string, string>;
    className?: string;
    isLoading?: boolean;
}

/**
 * Displays an overview dashboard aggregating data across all providers.
 */
export const GlobalDashboardView: React.FC<IGlobalDashboardViewProps> = ({
    globalStats,
    aggregatedEpochData,
    epochWalletData,
    stakingData,
    walletColorMap,
    className,
    isLoading = false,
}) => {
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [displayMode, setDisplayMode] = useState<DisplayMode>('daily');
    const [viewMode, setViewMode] = useState<ViewMode>('rewards');

    // Calculer les statistiques complètes pour les epochs
    const stats7 = useMemo<IEpochStats>(() => {
        const recentEpochs = aggregatedEpochData.slice(0, 7);
        if (recentEpochs.length === 0) return { min: 0, max: 0, avg: 0 };
        
        const values = recentEpochs.map(e => e.totalReward);
        return {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: globalStats.avg7 || values.reduce((a, b) => a + b, 0) / values.length
        };
    }, [aggregatedEpochData, globalStats.avg7]);

    const stats30 = useMemo<IEpochStats>(() => {
        const recentEpochs = aggregatedEpochData.slice(0, 30);
        if (recentEpochs.length === 0) return { min: 0, max: 0, avg: 0 };
        
        const values = recentEpochs.map(e => e.totalReward);
        return {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: globalStats.avg30 || values.reduce((a, b) => a + b, 0) / values.length
        };
    }, [aggregatedEpochData, globalStats.avg30]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <FunLoadingMessages spacing="large" />
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col space-y-6 p-4 md:p-6', className)}>
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">All Providers Overview</h2>
            </div>

            {/* Stats Section */}
            <Card className="bg-card/80 border-border/50 flex-shrink-0">
                <CardHeader>
                    <CardTitle>Global Statistics</CardTitle>
                    <CardDescription>Aggregated across selected wallets and providers.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 text-sm">
                    {/* Total Column */}
                    <div className="border-b sm:border-b-0 sm:border-r border-border/50 pb-4 sm:pb-0 sm:pr-6">
                        <p className="text-muted-foreground mb-1">Total Rewarded</p>
                        <p className="text-xl font-semibold font-mono">{formatEgld(globalStats.totalRewards)}</p>
                    </div>
                    {/* Epoch Stats - avec showMinMax à true pour afficher les mêmes statistiques que ProviderDetailView */}
                    <EpochStats 
                        stats7={stats7} 
                        stats30={stats30} 
                        showMinMax={true} 
                        className="col-span-2"
                    />
                </CardContent>
                {/* Wallet Percent Bar - only if several addresses */}
                {Object.keys(walletColorMap).length > 1 && globalStats.totalRewardsPerWallet && (
                    <WalletPercentBar
                        walletAmounts={globalStats.totalRewardsPerWallet}
                        walletColorMap={walletColorMap}
                        className="mb-2"
                    />
                )}
            </Card>

            {/* Chart Section */}
            <Card className="bg-card/80 border-border/50 flex flex-col flex-grow">
                <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle>
                            {viewMode === 'rewards' ? 'Total Rewards Per Epoch' : 'Total Staked Amount Per Epoch'}
                        </CardTitle>
                        <CardDescription>
                            {viewMode === 'rewards' 
                                ? `${displayMode === "daily" ? "Daily rewards" : "Cumulative rewards"} from all selected wallets per epoch.`
                                : "Total amount staked across all selected wallets per epoch."
                            }
                        </CardDescription>
                    </div>
                    <ChartToggles
                        viewMode={viewMode}
                        displayMode={displayMode}
                        chartType={chartType}
                        onViewModeChange={(value) => setViewMode(value)}
                        onDisplayModeChange={(value) => setDisplayMode(value)}
                        onChartTypeChange={(value) => setChartType(value)}
                    />
                </CardHeader>
                <CardContent className="flex-grow p-2">
                    {viewMode === 'rewards' ? (
                        <GlobalEpochChart 
                            aggregatedEpochData={aggregatedEpochData}
                            epochWalletData={epochWalletData}
                            chartType={chartType}
                            displayMode={displayMode}
                            className="mt-4"
                        />
                    ) : (
                        <GlobalStakedChart 
                            stakingData={stakingData}
                            className="h-[450px] min-h-[450px]"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}; 