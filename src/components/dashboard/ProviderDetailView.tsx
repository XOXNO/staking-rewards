/**
 * @file ProviderDetailView.tsx
 * @description Displays detailed stats and epoch chart for a selected provider.
 * @module components/dashboard/ProviderDetailView
 */

"use client";

import React, { useState, useMemo } from "react";
import {
  IXoxnoUserRewardsResponse,
  IProviderWithIdentity,
} from "@/api/types/xoxno-rewards.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { calculateProviderAggregatedStats, aggregateProviderEpochDataByWallet } from "@/lib/utils/calculationUtils";
import { formatEgld, shortenAddress } from "@/lib/utils/formatters";
import Image from "next/image";
import { ProviderEpochChart } from "@/components/charts";
import { ChartToggles, type ChartType, type DisplayMode, type ViewMode } from './ChartToggles';
import { getWalletColorMap } from '@/lib/utils/chartUtils';
import { CHART_COLORS } from '@/lib/constants/chartColors';
import { WalletPercentBar } from './WalletPercentBar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { FunLoadingMessages } from '@/components/ui/FunLoadingMessages';

interface IProviderDetailViewProps {
  selectedAddresses: string[];
  fullRewardsData: Record<string, IXoxnoUserRewardsResponse | null>;
  selectedProviderAddress: string;
  currentEpoch: number;
  className?: string;
  isLoading?: boolean;
}

interface IAggregatedProviderEpoch {
  epoch: number;
  totalEpochReward: number;
  epochUserRewards: number;
  ownerRewards: number;
}

export const ProviderDetailView: React.FC<IProviderDetailViewProps> = ({
  selectedAddresses,
  fullRewardsData,
  selectedProviderAddress,
  currentEpoch,
  className,
  isLoading = false,
}) => {
  // 1. Tous les hooks d'état en premier
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("daily");
  const [viewMode, setViewMode] = useState<ViewMode>('rewards');

  // 2. Trouver le providerIdentity - maintenant dans un useMemo
  const providerIdentity = useMemo(() => {
    for (const addr of selectedAddresses) {
      const identity = fullRewardsData[addr]?.providersWithIdentityInfo?.find(
        (p) => p.provider === selectedProviderAddress
      );
      if (identity) return identity;
    }
    return null;
  }, [selectedAddresses, fullRewardsData, selectedProviderAddress]);

  // 3. Tous les autres hooks useMemo
  const providerEpochWalletData = useMemo(() => {
    const allProvidersData: Record<string, any[]> = {};
    const providerOwners: Record<string, string> = {};
    selectedAddresses.forEach(addr => {
      const rewards = fullRewardsData[addr]?.providersFullRewardsData?.[selectedProviderAddress];
      if (rewards) {
        if (!allProvidersData[selectedProviderAddress]) allProvidersData[selectedProviderAddress] = [];
        allProvidersData[selectedProviderAddress].push(...rewards.map(epoch => ({ ...epoch, walletAddress: addr })));
      }
      const owner = fullRewardsData[addr]?.providersWithIdentityInfo?.find(p => p.provider === selectedProviderAddress)?.owner;
      if (owner) providerOwners[selectedProviderAddress] = owner;
    });
    return aggregateProviderEpochDataByWallet(allProvidersData, providerOwners, selectedAddresses, selectedProviderAddress);
  }, [fullRewardsData, selectedAddresses, selectedProviderAddress]);

  const providerStakingWalletData = useMemo(() => {
    const allProvidersData: Record<string, any[]> = {};
    const providerOwners: Record<string, string> = {};
    selectedAddresses.forEach(addr => {
      const rewards = fullRewardsData[addr]?.providersFullRewardsData?.[selectedProviderAddress];
      if (rewards) {
        if (!allProvidersData[selectedProviderAddress]) allProvidersData[selectedProviderAddress] = [];
        allProvidersData[selectedProviderAddress].push(...rewards.map(epoch => ({ ...epoch, walletAddress: addr })));
      }
      const owner = fullRewardsData[addr]?.providersWithIdentityInfo?.find(p => p.provider === selectedProviderAddress)?.owner;
      if (owner) providerOwners[selectedProviderAddress] = owner;
    });
    // @ts-ignore
    return require('@/lib/utils/calculationUtils').aggregateStakingDataByWallet(allProvidersData, providerOwners, selectedAddresses);
  }, [fullRewardsData, selectedAddresses, selectedProviderAddress]);

  const walletColorMap = useMemo(() => 
    getWalletColorMap(selectedAddresses, CHART_COLORS.categorical), 
    [selectedAddresses]
  );

  const sortedAggregatedEpochs = useMemo(() => {
    return [...providerEpochWalletData]
      .map(epochObj => ({
        epoch: epochObj.epoch,
        totalEpochReward: Object.entries(epochObj)
          .filter(([key]) => key !== 'epoch')
          .reduce((sum, [_, val]) => sum + Number(val), 0),
      }))
      .sort((a, b) => b.epoch - a.epoch);
  }, [providerEpochWalletData]);

  const totalProviderRewards = useMemo(
    () => sortedAggregatedEpochs.reduce(
      (sum, epoch) => sum + epoch.totalEpochReward,
      0
    ),
    [sortedAggregatedEpochs]
  );

  const stats7 = useMemo(
    () => calculateProviderAggregatedStats(7, sortedAggregatedEpochs),
    [sortedAggregatedEpochs]
  );

  const stats30 = useMemo(
    () => calculateProviderAggregatedStats(30, sortedAggregatedEpochs),
    [sortedAggregatedEpochs]
  );

  const isCurrentlyStaked = useMemo(() => {
    const lastEpoch = sortedAggregatedEpochs[0]?.epoch;
    return lastEpoch !== undefined && lastEpoch >= currentEpoch - 1;
  }, [sortedAggregatedEpochs, currentEpoch]);

  const walletTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    selectedAddresses.forEach(addr => {
      const rewards = fullRewardsData[addr]?.providersFullRewardsData?.[selectedProviderAddress];
      totals[addr] = rewards ? rewards.reduce((sum, epoch) => sum + (epoch.epochUserRewards || 0), 0) : 0;
    });
    return totals;
  }, [selectedAddresses, fullRewardsData, selectedProviderAddress]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FunLoadingMessages />
      </div>
    );
  }

  // Maintenant on peut faire le return conditionnel pour les données manquantes
  if (!providerIdentity) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted-foreground p-4 text-center", className)}>
        No data found for provider {shortenAddress(selectedProviderAddress)} across the selected wallets.
      </div>
    );
  }

  // Le reste du JSX reste inchangé
  return (
    <div className={cn("flex flex-col space-y-6 p-4 md:p-6 h-full", className)}>
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
          <p className="text-sm text-muted-foreground truncate">
            {shortenAddress(providerIdentity.provider, 10, 10)}
          </p>
        </div>
      </div>

      <Card className="bg-card/80 border-border/50 flex-shrink-0">
        <CardHeader>
          <CardTitle>Provider Statistics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 text-sm">
          <div className="sm:col-span-2 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-border/50 pb-4 lg:pb-0 lg:pr-6">
            <p className="text-muted-foreground mb-1">Total Rewarded (Selected Wallets)</p>
            <p className="text-xl font-semibold font-mono">{formatEgld(totalProviderRewards)}</p>
          </div>
          <div className="border-b sm:border-b-0 sm:border-r lg:border-r border-border/50 pb-4 sm:pb-0 sm:pr-6">
            <p className="text-muted-foreground mb-2 font-medium">Last 7 Epochs</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg:</span>
              <span className="font-mono">{formatEgld(stats7.avg)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min:</span>
              <span className="font-mono">{formatEgld(stats7.min)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max:</span>
              <span className="font-mono">{formatEgld(stats7.max)}</span>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-2 font-medium">Last 30 Epochs</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg:</span>
              <span className="font-mono">{formatEgld(stats30.avg)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min:</span>
              <span className="font-mono">{formatEgld(stats30.min)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max:</span>
              <span className="font-mono">{formatEgld(stats30.max)}</span>
            </div>
          </div>
        </CardContent>
        {selectedAddresses.length > 1 && (
          <WalletPercentBar
            walletAmounts={walletTotals}
            walletColorMap={walletColorMap}
            className="mb-2"
          />
        )}
      </Card>

      <Card className="bg-card/80 border-border/50 flex flex-col flex-grow overflow-hidden">
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>
              {viewMode === 'rewards' ? 'Epoch Rewards Chart' : 'Epoch Staked Amount Chart'}
            </CardTitle>
            <CardDescription>
              {viewMode === 'rewards'
                ? (displayMode === "daily" ? "Daily rewards" : "Cumulative rewards") + " received per epoch from this provider."
                : "Total amount staked across selected wallets per epoch for this provider."}
            </CardDescription>
          </div>
          <ChartToggles
            viewMode={viewMode}
            displayMode={displayMode}
            chartType={chartType}
            onViewModeChange={setViewMode}
            onDisplayModeChange={setDisplayMode}
            onChartTypeChange={setChartType}
          />
        </CardHeader>
        <CardContent className="flex-grow p-2">
          {viewMode === 'rewards' ? (
            <ProviderEpochChart
              epochWalletData={providerEpochWalletData}
              providerName={providerIdentity.identityInfo?.name || providerIdentity.provider}
              chartType={chartType}
              displayMode={displayMode}
              viewMode="rewards"
              className="h-[450px] min-h-[450px]"
            />
          ) : (
            <ProviderEpochChart
              epochWalletData={providerStakingWalletData}
              providerName={providerIdentity.identityInfo?.name || providerIdentity.provider}
              chartType="line"
              displayMode="daily"
              viewMode="staked"
              className="h-[450px] min-h-[450px]"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
