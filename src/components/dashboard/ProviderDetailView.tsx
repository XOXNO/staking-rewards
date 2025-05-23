/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
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
import { GlobalStakedChart } from "@/components/charts/GlobalStakedChart";
import { ChartToggles, type ChartType, type DisplayMode, type ViewMode, type CurrencyMode } from './ChartToggles';
import { getWalletColorMap } from '@/lib/utils/chartUtils';
import { CHART_COLORS } from '@/lib/constants/chartColors';
import { WalletDistribution } from './WalletDistribution';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { FunLoadingMessages } from '@/components/ui/FunLoadingMessages';
import { EpochStats } from '@/components/dashboard/EpochStats';

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
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('egld');

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
    return aggregateProviderEpochDataByWallet(allProvidersData, providerOwners, selectedAddresses, selectedProviderAddress, currencyMode);
  }, [fullRewardsData, selectedAddresses, selectedProviderAddress, currencyMode]);

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
      <div className="flex-1 flex items-center justify-center">
        <FunLoadingMessages spacing="large" />
      </div>
    );
  }

  // Now we can do the conditional return for missing data
  if (!providerIdentity) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted-foreground p-4 text-center", className)}>
        No data found for provider {shortenAddress(selectedProviderAddress)} across the selected wallets.
      </div>
    );
  }

  // Le reste du JSX reste inchangé
  return (
    <div className={cn("flex flex-col space-y-6 p-4 md:p-6", className)}>
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
          <EpochStats 
            stats7={stats7} 
            stats30={stats30} 
            showMinMax={true} 
            className="col-span-2"
          />
        </CardContent>
        {selectedAddresses.length > 1 && (
          <WalletDistribution
            walletAmounts={walletTotals}
            className="pb-3"
          />
        )}
      </Card>

      <Card className="bg-card/80 border-border/50 flex flex-col flex-grow">
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
            currencyMode={currencyMode}
            onViewModeChange={setViewMode}
            onDisplayModeChange={setDisplayMode}
            onChartTypeChange={setChartType}
            onCurrencyModeChange={setCurrencyMode}
          />
        </CardHeader>
        <CardContent className="flex-grow p-2">
          {viewMode === 'rewards' ? (
            <ProviderEpochChart
              epochWalletData={providerEpochWalletData}
              providerName={providerIdentity.identityInfo?.name || providerIdentity.provider}
              chartType={chartType}
              displayMode={displayMode}
              currencyMode={currencyMode}
              viewMode="rewards"
              className="h-[450px] min-h-[450px]"
            />
          ) : (
            <GlobalStakedChart
              stakingData={providerStakingWalletData}
              className="h-[450px] min-h-[450px]"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
