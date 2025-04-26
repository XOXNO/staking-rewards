/**
 * @file ProviderDetailView.tsx
 * @description Displays detailed stats and epoch chart for a selected provider.
 * @module components/dashboard/ProviderDetailView
 */

'use client';

import React, { useState } from 'react';
import {
    IXoxnoUserRewardsResponse,
} from '@/api/types/xoxno-rewards.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils/cn';
import { calculateLastNEpochAverage, calculateLastNEpochMinMax } from '@/lib/utils/calculationUtils';
import { formatEgld, shortenAddress } from '@/lib/utils/formatters';
import Image from 'next/image';
import { ProviderEpochChart } from '@/components/charts';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChartIcon, LineChartIcon } from "lucide-react";

interface IProviderDetailViewProps {
    rewardsResponse: IXoxnoUserRewardsResponse;
    selectedProviderAddress: string;
    activeAddress: string;
    className?: string;
}

// Define chart type
type ChartType = 'bar' | 'line';

/**
 * Displays details for a single selected staking provider.
 */
export const ProviderDetailView: React.FC<IProviderDetailViewProps> = ({
    rewardsResponse,
    selectedProviderAddress,
    activeAddress,
    className,
}) => {
    const providerIdentity = rewardsResponse.providersWithIdentityInfo?.find(
        p => p.provider === selectedProviderAddress
    );
    const providerEpochData = rewardsResponse.providersFullRewardsData?.[selectedProviderAddress];
    const currentEpoch = rewardsResponse.currentEpoch;
    const [chartType, setChartType] = useState<ChartType>('bar'); // Default to bar chart

    if (!providerIdentity) {
        return (
            <div className={cn("flex items-center justify-center h-full text-muted-foreground", className)}>
                Select a provider from the sidebar to view details.
            </div>
        );
    }

    // Recalculate stats specifically for this provider
    const providerOwnerAddress = providerIdentity.owner;
    const isOwner = activeAddress === providerOwnerAddress;
    const sortedEpochRewards = [...(providerEpochData ?? [])].sort((a, b) => b.epoch - a.epoch);
    
    const totalProviderRewards = sortedEpochRewards.reduce((sum, epoch) => {
        return sum + epoch.epochUserRewards + (isOwner ? epoch.ownerRewards : 0);
    }, 0);
    const avg7 = calculateLastNEpochAverage(sortedEpochRewards, 7, activeAddress, providerOwnerAddress);
    const avg30 = calculateLastNEpochAverage(sortedEpochRewards, 30, activeAddress, providerOwnerAddress);
    const minMax7 = calculateLastNEpochMinMax(sortedEpochRewards, 7, activeAddress, providerOwnerAddress);
    const minMax30 = calculateLastNEpochMinMax(sortedEpochRewards, 30, activeAddress, providerOwnerAddress);

    // Determine if currently staked
    const lastEpoch = sortedEpochRewards[0]?.epoch;
    const isCurrentlyStaked = lastEpoch !== undefined && lastEpoch >= currentEpoch - 1; // Check if last reward epoch is current or previous

    return (
        <div className={cn('flex flex-col space-y-6 p-4 md:p-6 h-full', className)}>
            {/* Provider Header */}
            <div className="flex items-center space-x-4 flex-shrink-0">
                {providerIdentity.identityInfo?.avatar && (
                    <Image
                        src={providerIdentity.identityInfo.avatar}
                        alt={providerIdentity.identityInfo.name || providerIdentity.provider}
                        width={48}
                        height={48}
                        className="rounded-full w-12 h-12 object-cover border"
                    />
                )}
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        {providerIdentity.identityInfo?.name || providerIdentity.identity || providerIdentity.provider}
                        {isCurrentlyStaked && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-300 dark:border-green-700">
                                Currently Staked
                            </Badge>
                        )}
                    </h2>
                    <p className="text-sm text-muted-foreground truncate">{shortenAddress(providerIdentity.provider, 10, 10)}</p>
                </div>
            </div>

            {/* Stats Section */}
            <Card className="bg-card/80 border-border/50 flex-shrink-0">
                 <CardHeader>
                     <CardTitle>Provider Statistics</CardTitle>
                 </CardHeader>
                 <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 text-sm">
                    {/* Total Column - Spans full width on small, half on sm, third on lg */}
                    <div className="sm:col-span-2 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-border/50 pb-4 lg:pb-0 lg:pr-6">
                        <p className="text-muted-foreground mb-1">Total Rewarded</p>
                        <p className="text-xl font-semibold font-mono">{formatEgld(totalProviderRewards)}</p>
                    </div>
                    {/* 7 Day Column */}
                    <div className="border-b sm:border-b-0 sm:border-r lg:border-r border-border/50 pb-4 sm:pb-0 sm:pr-6">
                        <p className="text-muted-foreground mb-2 font-medium">Last 7 Epochs</p>
                        <div className="flex justify-between"><span className="text-muted-foreground">Avg:</span> <span className="font-mono">{formatEgld(avg7)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Min:</span> <span className="font-mono">{formatEgld(minMax7.min)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Max:</span> <span className="font-mono">{formatEgld(minMax7.max)}</span></div>
                    </div>
                    {/* 30 Day Column */}
                    <div>
                        <p className="text-muted-foreground mb-2 font-medium">Last 30 Epochs</p>
                        <div className="flex justify-between"><span className="text-muted-foreground">Avg:</span> <span className="font-mono">{formatEgld(avg30)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Min:</span> <span className="font-mono">{formatEgld(minMax30.min)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Max:</span> <span className="font-mono">{formatEgld(minMax30.max)}</span></div>
                    </div>
                 </CardContent>
             </Card>

            {/* Chart Section */}
            <Card className="bg-card/80 border-border/50 flex flex-col flex-grow overflow-hidden">
                <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle>Epoch Rewards Chart</CardTitle>
                        <CardDescription>Rewards received per epoch from this provider.</CardDescription>
                    </div>
                    <ToggleGroup 
                        type="single" 
                        variant="outline"
                        value={chartType}
                        onValueChange={(value: ChartType) => { if (value) setChartType(value); }}
                        size="sm"
                        aria-label="Chart Type"
                    >
                        <ToggleGroupItem value="bar" aria-label="Bar chart">
                            <BarChartIcon className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="line" aria-label="Line chart">
                            <LineChartIcon className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </CardHeader>
                <CardContent className="flex-grow p-2">
                    <ProviderEpochChart
                        epochData={sortedEpochRewards}
                        providerName={providerIdentity.identityInfo?.name || providerIdentity.provider}
                        activeAddress={activeAddress}
                        providerOwnerAddress={providerOwnerAddress}
                        chartType={chartType}
                        className="h-full"
                    />
                </CardContent>
            </Card>
        </div>
    );
}; 