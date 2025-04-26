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

    const rewards = lastNEpochs.map(epoch => calculateEpochTotalReward(epoch, activeAddress, ownerAddress));
    return {
        min: Math.min(...rewards),
        max: Math.max(...rewards),
    };
};

// --- Global Aggregation Functions ---

/**
 * Aggregates epoch reward data across all providers.
 */
export const aggregateAllEpochData = (
    allProvidersData: Record<string, IEpochRewardData[]> | undefined,
    providerOwners: Record<string, string>,
    activeAddress: string
): IAggregatedEpochData[] => {
    if (!allProvidersData) return [];

    const aggregatedMap: Map<number, number> = new Map();

    Object.entries(allProvidersData).forEach(([providerAddress, epochDataArray]) => {
        const ownerAddress = providerOwners[providerAddress];
        if (!ownerAddress) return; // Skip if owner info is missing

        epochDataArray.forEach(epochData => {
            const epochReward = calculateEpochTotalReward(epochData, activeAddress, ownerAddress);
            const currentTotal = aggregatedMap.get(epochData.epoch) || 0;
            aggregatedMap.set(epochData.epoch, currentTotal + epochReward);
        });
    });

    // Convert map to array and sort by epoch
    const aggregatedArray = Array.from(aggregatedMap.entries()).map(([epoch, totalReward]) => ({
        epoch,
        totalReward,
    }));

    return aggregatedArray.sort((a, b) => a.epoch - b.epoch);
};

/**
 * Calculates global statistics (total, 7/30 day avg/min/max) from aggregated epoch data.
 */
export const calculateGlobalStats = (
    aggregatedEpochData: IAggregatedEpochData[]
): IGlobalStats => {
    const sortedGlobalEpochs = [...aggregatedEpochData].sort((a, b) => b.epoch - a.epoch); // Sort descending for slicing last N

    const totalRewards = sortedGlobalEpochs.reduce((sum, epoch) => sum + epoch.totalReward, 0);

    const calculateStats = (n: number): { avg: number; min: number; max: number } => {
        if (sortedGlobalEpochs.length === 0) return { avg: 0, min: 0, max: 0 };
        const lastNEpochs = sortedGlobalEpochs.slice(0, n);
        if (lastNEpochs.length === 0) return { avg: 0, min: 0, max: 0 };
        const rewards = lastNEpochs.map(e => e.totalReward);
        const total = rewards.reduce((sum, r) => sum + r, 0);
        return {
            avg: total / rewards.length,
            min: Math.min(...rewards),
            max: Math.max(...rewards),
        };
    };

    const stats7 = calculateStats(7);
    const stats30 = calculateStats(30);

    return {
        totalRewards,
        avg7: stats7.avg,
        minMax7: { min: stats7.min, max: stats7.max },
        avg30: stats30.avg,
        minMax30: { min: stats30.min, max: stats30.max },
    };
}; 