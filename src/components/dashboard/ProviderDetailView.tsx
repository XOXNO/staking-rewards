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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChartIcon, LineChartIcon } from "lucide-react";
import { getWalletColorMap } from '@/lib/utils/utils';
import { CHART_COLORS } from '@/lib/constants/chartColors';
import { WalletPercentBar } from './WalletPercentBar';

interface IProviderDetailViewProps {
  selectedAddresses: string[];
  fullRewardsData: Record<string, IXoxnoUserRewardsResponse | null>;
  selectedProviderAddress: string;
  currentEpoch: number;
  className?: string;
}

// Define chart type
type ChartType = "bar" | "line";

// Define a matching type here or import if defined globally
interface IAggregatedProviderEpoch {
  epoch: number;
  totalEpochReward: number;
  // Ensure this matches the structure returned by the useMemo hook
  epochUserRewards: number;
  ownerRewards: number;
}

/**
 * Displays details for a single selected staking provider, aggregated across selected wallets.
 */
export const ProviderDetailView: React.FC<IProviderDetailViewProps> = ({
  selectedAddresses,
  fullRewardsData,
  selectedProviderAddress,
  currentEpoch,
  className,
}) => {
  const [chartType, setChartType] = useState<ChartType>("bar");

  // 1. Find Provider Identity (find from first available response for simplicity for now)
  let providerIdentity: IProviderWithIdentity | undefined;
  for (const addr of selectedAddresses) {
    providerIdentity = fullRewardsData[addr]?.providersWithIdentityInfo?.find(
      (p) => p.provider === selectedProviderAddress
    );
    if (providerIdentity) break;
  }

  // 2. Aggregate Epoch Data (Result is providerEpochDataAggregated)
  const providerEpochWalletData = useMemo(() => {
    // On construit la structure { [wallet]: montant } pour chaque epoch, pour ce provider
    // On reconstitue le format attendu à partir de fullRewardsData
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

  // Mapping wallet -> couleur (palette catégorielle)
  const walletColorMap = useMemo(() => getWalletColorMap(selectedAddresses, CHART_COLORS.categorical), [selectedAddresses]);

  // 3. Recalculate Stats using the new helper
  const sortedAggregatedEpochs = useMemo(() => {
    // On convertit le format { epoch, [wallet]: number }[] en IAggregatedProviderEpoch[]
    return [...providerEpochWalletData]
      .map(epochObj => ({
        epoch: epochObj.epoch,
        totalEpochReward: Object.entries(epochObj)
          .filter(([key]) => key !== 'epoch')
          .reduce((sum, [_, val]) => sum + Number(val), 0),
        // Optionnel: on peut ajouter epochUserRewards/ownerRewards si besoin
      }))
      .sort((a, b) => b.epoch - a.epoch); // Sort descending
  }, [providerEpochWalletData]);

  const totalProviderRewards = useMemo(
    () =>
      sortedAggregatedEpochs.reduce(
        (sum, epoch) => sum + epoch.totalEpochReward,
        0
      ),
    [sortedAggregatedEpochs]
  );

  // Use the new calculation function
  const stats7 = useMemo(
    () => calculateProviderAggregatedStats(7, sortedAggregatedEpochs),
    [sortedAggregatedEpochs]
  );
  const stats30 = useMemo(
    () => calculateProviderAggregatedStats(30, sortedAggregatedEpochs),
    [sortedAggregatedEpochs]
  );
  // Remove placeholders
  // const avg7 = 0;
  // const avg30 = 0;
  // const minMax7 = { min: 0, max: 0 };
  // const minMax30 = { min: 0, max: 0 };

  // Update isCurrentlyStaked logic
  const isCurrentlyStaked = useMemo(() => {
    const lastEpoch = sortedAggregatedEpochs[0]?.epoch;
    // Check if *any* selected wallet received rewards in the current or previous epoch from this provider
    return lastEpoch !== undefined && lastEpoch >= currentEpoch - 1;
  }, [sortedAggregatedEpochs, currentEpoch]);

  if (!providerIdentity) {
    // This message might appear if the selected provider doesn't exist for *any* selected wallet
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full text-muted-foreground p-4 text-center",
          className
        )}
      >
        No data found for provider {shortenAddress(selectedProviderAddress)}{" "}
        across the selected wallets.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col space-y-6 p-4 md:p-6 h-full", className)}>
      {/* Provider Header */}
      <div className="flex items-center space-x-4 flex-shrink-0">
        {providerIdentity.identityInfo?.avatar && (
          <Image
            src={providerIdentity.identityInfo.avatar}
            alt={
              providerIdentity.identityInfo.name || providerIdentity.provider
            }
            width={48}
            height={48}
            className="rounded-full w-12 h-12 object-cover border"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {providerIdentity.identityInfo?.name ||
              providerIdentity.identity ||
              providerIdentity.provider}
            {isCurrentlyStaked && (
              <Badge
                variant="secondary"
                className="text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-300 dark:border-green-700"
              >
                Currently Staked
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground truncate">
            {shortenAddress(providerIdentity.provider, 10, 10)}
          </p>
        </div>
      </div>

      {/* Stats Section - Use calculated stats */}
      <Card className="bg-card/80 border-border/50 flex-shrink-0">
        <CardHeader>
          <CardTitle>Provider Statistics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 text-sm">
          {/* Total Column */}
          <div className="sm:col-span-2 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-border/50 pb-4 lg:pb-0 lg:pr-6">
            <p className="text-muted-foreground mb-1">
              Total Rewarded (Selected Wallets)
            </p>
            <p className="text-xl font-semibold font-mono">
              {formatEgld(totalProviderRewards)}
            </p>
          </div>
          {/* 7 Day Column - Use new stats object */}
          <div className="border-b sm:border-b-0 sm:border-r lg:border-r border-border/50 pb-4 sm:pb-0 sm:pr-6">
            <p className="text-muted-foreground mb-2 font-medium">
              Last 7 Epochs
            </p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg:</span>{' '}
              <span className="font-mono">{formatEgld(stats7.avg)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min:</span>{' '}
              <span className="font-mono">{formatEgld(stats7.min)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max:</span>{' '}
              <span className="font-mono">{formatEgld(stats7.max)}</span>
            </div>
          </div>
          {/* 30 Day Column - Use new stats object */}
          <div>
            <p className="text-muted-foreground mb-2 font-medium">
              Last 30 Epochs
            </p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg:</span>{' '}
              <span className="font-mono">{formatEgld(stats30.avg)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min:</span>{' '}
              <span className="font-mono">{formatEgld(stats30.min)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max:</span>{' '}
              <span className="font-mono">{formatEgld(stats30.max)}</span>
            </div>
          </div>
        </CardContent>
        {/* Wallet Percent Bar - only if several addresses */}
        {selectedAddresses.length > 1 && (
          <WalletPercentBar
            walletAmounts={React.useMemo(() => {
              // Calcule le total par wallet pour ce provider
              const walletTotals: Record<string, number> = {};
              selectedAddresses.forEach(addr => {
                const rewards = fullRewardsData[addr]?.providersFullRewardsData?.[selectedProviderAddress];
                walletTotals[addr] = rewards ? rewards.reduce((sum, epoch) => sum + (epoch.epochUserRewards || 0), 0) : 0;
              });
              return walletTotals;
            }, [selectedAddresses, fullRewardsData, selectedProviderAddress])}
            walletColorMap={walletColorMap}
            className="mb-2"
          />
        )}
      </Card>

      {/* Chart Section */}
      <Card className="bg-card/80 border-border/50 flex flex-col flex-grow overflow-hidden">
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Epoch Rewards Chart</CardTitle>
            <CardDescription>
              Rewards received per epoch from this provider.
            </CardDescription>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            value={chartType}
            onValueChange={(value: ChartType) => {
              if (value) setChartType(value);
            }}
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
            epochWalletData={providerEpochWalletData}
            walletColorMap={walletColorMap}
            providerName={
              providerIdentity.identityInfo?.name || providerIdentity.provider
            }
            chartType={chartType}
            className="h-[450px] min-h-[450px]"
          />
        </CardContent>
      </Card>
    </div>
  );
};
