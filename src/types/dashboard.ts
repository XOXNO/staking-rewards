/**
 * @file src/types/dashboard.ts
 * @description Shared types for dashboard components.
 */

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