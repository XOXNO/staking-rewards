/**
 * @file calculationUtils.ts
 * @description Utility functions for calculations, e.g., epoch averages.
 * @module lib/utils
 */

import { IEpochRewardData } from "@/api/types/xoxno-rewards.types";
import { IAggregatedEpochData, IGlobalStats } from "@/types/dashboard";

/**
 * Calculates the total rewards for a single epoch, considering user and potential owner rewards.
 */
const calculateEpochTotalReward = (
  epochData: IEpochRewardData,
  activeAddress: string,
  ownerAddress: string
): number => {
  const isOwner = activeAddress === ownerAddress;
  return epochData.epochUserRewards + (isOwner ? epochData.ownerRewards : 0);
};

/**
 * Calculates the average reward over the last N epochs for a single provider.
 */
export const calculateLastNEpochAverage = (
  epochRewards: IEpochRewardData[],
  n: number,
  activeAddress: string,
  ownerAddress: string
): number => {
  if (!epochRewards || epochRewards.length === 0) return 0;
  const lastNEpochs = epochRewards.slice(0, n);
  const total = lastNEpochs.reduce((sum, epoch) => {
    return sum + calculateEpochTotalReward(epoch, activeAddress, ownerAddress);
  }, 0);
  return lastNEpochs.length > 0 ? total / lastNEpochs.length : 0;
};

/**
 * Calculates the minimum and maximum reward over the last N epochs for a single provider.
 */
export const calculateLastNEpochMinMax = (
  epochRewards: IEpochRewardData[],
  n: number,
  activeAddress: string,
  ownerAddress: string
): { min: number; max: number } => {
  if (!epochRewards || epochRewards.length === 0) return { min: 0, max: 0 };
  const lastNEpochs = epochRewards.slice(0, n);
  if (lastNEpochs.length === 0) return { min: 0, max: 0 };

  const rewards = lastNEpochs.map((epoch) =>
    calculateEpochTotalReward(epoch, activeAddress, ownerAddress)
  );
  return {
    min: Math.min(...rewards),
    max: Math.max(...rewards),
  };
};

// --- Global Aggregation Functions ---

/**
 * Aggregates epoch reward data across all providers.
 * Checks if *any* selected address is the owner for adding owner rewards.
 */
export const aggregateAllEpochData = (
  allProvidersData: Record<string, IEpochRewardData[]> | undefined,
  providerOwners: Record<string, string>,
  selectedAddresses: string[]
): IAggregatedEpochData[] => {
  if (!allProvidersData || selectedAddresses.length === 0) return [];

  const aggregatedMap: Map<number, number> = new Map();

  Object.entries(allProvidersData).forEach(
    ([providerAddress, epochDataArray]) => {
      const ownerAddress = providerOwners[providerAddress];

      // Determine if *any* selected address is the owner of this provider
      const isAnySelectedAddressOwner =
        selectedAddresses.includes(ownerAddress);

      epochDataArray.forEach((epochData) => {
        // Calculate base user reward
        let epochReward = epochData.epochUserRewards || 0;
        // Add owner rewards only if one of the selected addresses is the owner
        if (isAnySelectedAddressOwner) {
          epochReward += epochData.ownerRewards || 0;
        }

        const currentTotal = aggregatedMap.get(epochData.epoch) || 0;
        aggregatedMap.set(epochData.epoch, currentTotal + epochReward);
      });
    }
  );

  // Convert map to array and sort by epoch
  const aggregatedArray = Array.from(aggregatedMap.entries()).map(
    ([epoch, totalReward]) => ({
      epoch,
      totalReward: totalReward || 0,
    })
  );

  return aggregatedArray.sort((a, b) => a.epoch - b.epoch);
};

/**
 * Calculates global statistics (total, 7/30 day avg/min/max) from aggregated epoch data.
 */
export const calculateGlobalStats = (
  aggregatedEpochData: IAggregatedEpochData[]
): IGlobalStats => {
  const sortedGlobalEpochs = [...aggregatedEpochData].sort(
    (a, b) => b.epoch - a.epoch
  ); // Sort descending for slicing last N
  const totalRewards = sortedGlobalEpochs.reduce(
    (sum, epoch) => sum + (epoch.totalReward || 0),
    0
  );

  const calculateStats = (
    n: number
  ): { avg: number; min: number; max: number } => {
    if (sortedGlobalEpochs.length === 0) return { avg: 0, min: 0, max: 0 };

    const lastNEpochs = sortedGlobalEpochs.slice(0, n);

    if (lastNEpochs.length === 0) return { avg: 0, min: 0, max: 0 };

    const rewards = lastNEpochs.map((e) => e.totalReward);

    const total = rewards.reduce((sum, r) => sum + r, 0);
    const avg = rewards.length > 0 ? total / rewards.length : 0;
    // Ensure Math.min/max doesn't get an empty array, although checked above
    const min = rewards.length > 0 ? Math.min(...rewards) : 0;
    const max = rewards.length > 0 ? Math.max(...rewards) : 0;

    return {
      avg,
      min,
      max,
    };
  };

  const stats7 = calculateStats(7);
  const stats30 = calculateStats(30);

  const finalStats = {
    totalRewards,
    avg7: stats7.avg,
    minMax7: { min: stats7.min, max: stats7.max },
    avg30: stats30.avg,
    minMax30: { min: stats30.min, max: stats30.max },
  };
  return finalStats;
};

// --- Provider Detail Aggregated Stats ---

// Define a type for the aggregated epoch data used by ProviderDetailView
// (It includes totalEpochReward but we might operate on that)
interface IAggregatedProviderEpoch {
  epoch: number;
  totalEpochReward: number;
  // Add other fields if needed by calculations
}

/**
 * Calculates stats (avg, min, max) over the last N epochs from provider-specific aggregated data.
 */
export const calculateProviderAggregatedStats = (
  n: number,
  sortedAggregatedEpochs: IAggregatedProviderEpoch[]
): { avg: number; min: number; max: number } => {
  if (sortedAggregatedEpochs.length === 0) return { avg: 0, min: 0, max: 0 };

  const lastNEpochs = sortedAggregatedEpochs.slice(0, n);

  if (lastNEpochs.length === 0) return { avg: 0, min: 0, max: 0 };

  // Use totalEpochReward for provider-level aggregation stats
  const rewards = lastNEpochs.map((e) => e.totalEpochReward);

  const total = rewards.reduce((sum, r) => sum + r, 0);
  const avg = rewards.length > 0 ? total / rewards.length : 0;
  const min = rewards.length > 0 ? Math.min(...rewards) : 0;
  const max = rewards.length > 0 ? Math.max(...rewards) : 0;

  return { avg, min, max };
};

// Type utilitaire pour l'aggregation par wallet
interface EpochRewardDataWithWallet extends IEpochRewardData {
  walletAddress: string;
}

/**
 * Agrège les rewards par wallet pour chaque epoch (pour stacked chart par wallet).
 * Peut être utilisée pour le global (tous providers) ou un provider spécifique.
 *
 * @param allProvidersData - Record<provider, IEpochRewardData[]> (pour global) OU { [provider]: epochs[] } (pour un provider)
 * @param providerOwners - mapping provider -> owner
 * @param selectedAddresses - adresses sélectionnées
 * @param filterProvider - optionnel, provider à filtrer (pour provider chart)
 * @returns Array<{ epoch, [wallet]: montant }>
 */
export function aggregateEpochDataByWallet(
  allProvidersData: Record<string, EpochRewardDataWithWallet[]> | undefined,
  providerOwners: Record<string, string>,
  selectedAddresses: string[],
  filterProvider?: string
): Array<{ epoch: number; [wallet: string]: number }> {
  if (!allProvidersData || selectedAddresses.length === 0) return [];

  const epochWalletMap: Map<number, Record<string, number>> = new Map();

  Object.entries(allProvidersData).forEach(([providerAddress, epochDataArray]) => {
    if (filterProvider && providerAddress !== filterProvider) return;
    const ownerAddress = providerOwners[providerAddress];

    epochDataArray.forEach(epochData => {
      selectedAddresses.forEach(wallet => {
        let reward = 0;
        if (epochData.walletAddress === wallet) {
          reward += epochData.epochUserRewards || 0;
        }
        if (wallet === ownerAddress) {
          reward += epochData.ownerRewards || 0;
        }
        if (reward > 0) {
          if (!epochWalletMap.has(epochData.epoch)) {
            epochWalletMap.set(epochData.epoch, {});
          }
          const walletMap = epochWalletMap.get(epochData.epoch)!;
          walletMap[wallet] = (walletMap[wallet] || 0) + reward;
        }
      });
    });
  });

  const result = Array.from(epochWalletMap.entries())
    .map(([epoch, walletMap]) => ({ epoch, ...walletMap }))
    .sort((a, b) => a.epoch - b.epoch);

  return result;
}

/**
 * Agrège les rewards par wallet pour chaque epoch d'un provider donné.
 * @param allProvidersData - Toutes les données de rewards (avec walletAddress)
 * @param providerOwners - Mapping provider -> owner
 * @param selectedAddresses - Wallets sélectionnés
 * @param provider - Provider à filtrer (obligatoire)
 * @returns Array<{ epoch: number; [wallet: string]: number }>
 */
export function aggregateProviderEpochDataByWallet(
  allProvidersData: Record<string, EpochRewardDataWithWallet[]> | undefined,
  providerOwners: Record<string, string>,
  selectedAddresses: string[],
  provider: string
): Array<{ epoch: number; [wallet: string]: number }> {
  if (!allProvidersData || selectedAddresses.length === 0 || !provider) return [];

  const epochWalletMap: Map<number, Record<string, number>> = new Map();
  const epochDataArray = allProvidersData[provider] || [];
  const ownerAddress = providerOwners[provider];

  epochDataArray.forEach(epochData => {
    selectedAddresses.forEach(wallet => {
      let reward = 0;
      if (epochData.walletAddress === wallet) {
        reward += epochData.epochUserRewards || 0;
      }
      if (wallet === ownerAddress) {
        reward += epochData.ownerRewards || 0;
      }
      if (reward > 0) {
        if (!epochWalletMap.has(epochData.epoch)) {
          epochWalletMap.set(epochData.epoch, {});
        }
        const walletMap = epochWalletMap.get(epochData.epoch)!;
        walletMap[wallet] = (walletMap[wallet] || 0) + reward;
      }
    });
  });

  return Array.from(epochWalletMap.entries())
    .map(([epoch, walletMap]) => ({ epoch, ...walletMap }))
    .sort((a, b) => a.epoch - b.epoch);
}
