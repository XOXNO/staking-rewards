/**
 * @file GlobalDashboardView.tsx
 * @description Displays aggregated statistics and charts for all providers.
 * @module components/dashboard/GlobalDashboardView
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from '@/lib/utils/cn';
import { formatEgld } from '@/lib/utils/formatters';
import { IGlobalStats, IAggregatedEpochData } from '@/types/dashboard'; // Assuming types exist
import { GlobalEpochChart, GlobalStakedChart } from '@/components/charts';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChartIcon, LineChartIcon, TrendingUpIcon, CalendarIcon, CoinsIcon, WalletIcon } from "lucide-react";
import { WalletPercentBar } from './WalletPercentBar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface IGlobalDashboardViewProps {
    globalStats: IGlobalStats;
    aggregatedEpochData: IAggregatedEpochData[];
    epochWalletData: Array<{ epoch: number; [wallet: string]: number }>;
    stakingData: Array<{ epoch: number; [wallet: string]: number }>;  // Données de staking par epoch et par wallet
    walletColorMap: Record<string, string>;
    className?: string;
}

// Define chart types and modes
type ChartType = 'bar' | 'line';
type DisplayMode = 'daily' | 'cumulative';
type ViewMode = 'rewards' | 'staked';

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
}) => {
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [displayMode, setDisplayMode] = useState<DisplayMode>('daily');
    const [viewMode, setViewMode] = useState<ViewMode>('rewards');

    return (
        <div className={cn('flex flex-col space-y-6 p-4 md:p-6 h-full', className)}>
            <h2 className="text-2xl font-bold">All Providers Overview</h2>

            {/* Stats Section */}
            <Card className="bg-card/80 border-border/50 flex-shrink-0">
                <CardHeader>
                    <CardTitle>Global Statistics</CardTitle>
                    <CardDescription>Aggregated across selected wallets and providers.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-sm">
                    {/* Total Column */}
                    <div className="border-b sm:border-b-0 sm:border-r border-border/50 pb-4 sm:pb-0 sm:pr-6">
                        <p className="text-muted-foreground mb-1">Total Rewarded</p>
                        <p className="text-xl font-semibold font-mono">{formatEgld(globalStats.totalRewards)}</p>
                    </div>
                    {/* Avg Per Epoch - Removing as not available */}
                    {/* <div className="border-b sm:border-b-0 lg:border-r border-border/50 pb-4 sm:pb-0 sm:pr-6">
                        <p className="text-muted-foreground mb-1">Avg Per Epoch (All Time)</p>
                        <p className="text-xl font-semibold font-mono">{formatEgld(globalStats.avgOverall)}</p>
                    </div> */}
                    {/* Last 7 Epochs */}
                    <div className="border-b sm:border-b-0 sm:border-r border-border/50 pb-4 sm:pb-0 sm:pr-6">
                        <p className="text-muted-foreground mb-1">Last 7 Epochs Avg</p>
                        <p className="text-xl font-semibold font-mono">{formatEgld(globalStats.avg7)}</p>
                    </div>
                    {/* Last 30 Epochs */}
                    <div>
                        <p className="text-muted-foreground mb-1">Last 30 Epochs Avg</p>
                        <p className="text-xl font-semibold font-mono">{formatEgld(globalStats.avg30)}</p>
                    </div>
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
            <Card className="bg-card/80 border-border/50 flex flex-col flex-grow overflow-hidden">
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
                    <div className="flex gap-2">
                        {/* View Mode Toggle */}
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={viewMode}
                            onValueChange={(value: ViewMode) => { if (value) setViewMode(value); }}
                            size="sm"
                            aria-label="View Mode"
                        >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ToggleGroupItem value="rewards" aria-label="Show rewards">
                                  <CoinsIcon className="h-4 w-4" />
                                </ToggleGroupItem>
                              </TooltipTrigger>
                              <TooltipContent side="top">Show rewards per epoch</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ToggleGroupItem value="staked" aria-label="Show staked amount">
                                  <WalletIcon className="h-4 w-4" />
                                </ToggleGroupItem>
                              </TooltipTrigger>
                              <TooltipContent side="top">Show staked amount per epoch</TooltipContent>
                            </Tooltip>
                        </ToggleGroup>

                        {/* Only show these toggles for rewards view */}
                        {viewMode === 'rewards' && (
                            <>
                                <ToggleGroup
                                    type="single"
                                    variant="outline"
                                    value={displayMode}
                                    onValueChange={(value: DisplayMode) => { if (value) setDisplayMode(value); }}
                                    size="sm"
                                    aria-label="Display Mode"
                                >
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <ToggleGroupItem value="daily" aria-label="Daily rewards">
                                          <CalendarIcon className="h-4 w-4" />
                                        </ToggleGroupItem>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">Show daily values</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <ToggleGroupItem value="cumulative" aria-label="Cumulative rewards">
                                          <TrendingUpIcon className="h-4 w-4" />
                                        </ToggleGroupItem>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">Show cumulative values</TooltipContent>
                                    </Tooltip>
                                </ToggleGroup>
                                <ToggleGroup 
                                    type="single" 
                                    variant="outline"
                                    value={chartType}
                                    onValueChange={(value: ChartType) => { if (value) setChartType(value); }}
                                    size="sm"
                                    aria-label="Chart Type"
                                >
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <ToggleGroupItem value="bar" aria-label="Bar chart">
                                          <BarChartIcon className="h-4 w-4" />
                                        </ToggleGroupItem>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">Bar chart</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <ToggleGroupItem value="line" aria-label="Line chart">
                                          <LineChartIcon className="h-4 w-4" />
                                        </ToggleGroupItem>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">Line chart</TooltipContent>
                                    </Tooltip>
                                </ToggleGroup>
                            </>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex-grow p-2">
                    {viewMode === 'rewards' ? (
                        <GlobalEpochChart 
                            aggregatedEpochData={aggregatedEpochData}
                            epochWalletData={epochWalletData}
                            walletColorMap={walletColorMap}
                            chartType={chartType}
                            displayMode={displayMode}
                            className="h-[450px] min-h-[450px]"
                        />
                    ) : (
                        <GlobalStakedChart 
                            stakingData={stakingData}
                            walletColorMap={walletColorMap}
                            className="h-[450px] min-h-[450px]"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}; 