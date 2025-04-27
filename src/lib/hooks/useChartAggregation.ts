/**
 * @file useChartAggregation.ts
 * @description Custom hook to aggregate chart data based on the number of data points.
 * @module lib/hooks
 */

import { useMemo } from 'react';

// --- Configuration ---
const MAX_POINTS_BEFORE_AGGREGATION = 100; // Threshold for aggregation
const AGGREGATION_INTERVAL = 7; // Aggregate weekly by default

// --- Input Data Type ---
// Generic type for epoch data points expected by the hook
// Ensures `epoch` and a numerical `value` field exist.
interface EpochDataPoint {
    epoch: number;
    value: number; // Generic value field (e.g., reward, totalReward)
    [key: string]: unknown; // Allow other properties
}

// --- Output Data Type ---
// Type for the processed data returned by the hook
export interface ProcessedChartDataPoint {
    epoch: number | string; // Can be epoch number or a label string
    reward: number; // The value to plot (original or averaged)
    label?: string; // Optional label for aggregated points (e.g., "Epochs X-Y (Avg)")
}

// --- Hook Implementation ---

/**
 * Aggregates epoch-based chart data if the number of points exceeds a threshold.
 * 
 * @template T - The type of the raw epoch data points, must extend EpochDataPoint.
 * @param {T[] | undefined} rawData - The raw array of epoch data points.
 * @param {keyof T} valueKey - The key in the raw data objects that holds the numerical value to be plotted/aggregated.
 * @returns {ProcessedChartDataPoint[]} The processed data ready for the chart component.
 */
export function useChartAggregation<T extends EpochDataPoint>(
    rawData: T[] | undefined,
    valueKey: keyof T = 'value' // Default to 'value', can be overridden
): ProcessedChartDataPoint[] {

    const processedChartData = useMemo(() => {
        if (!rawData || rawData.length === 0) {
            return [];
        }

        // Ensure data is sorted by epoch ascendingly
        const sortedEpochs = [...rawData].sort((a, b) => a.epoch - b.epoch);

        if (sortedEpochs.length > MAX_POINTS_BEFORE_AGGREGATION) {
            // --- Aggregate Data --- 
            const aggregatedData: ProcessedChartDataPoint[] = [];
            for (let i = 0; i < sortedEpochs.length; i += AGGREGATION_INTERVAL) {
                const chunk = sortedEpochs.slice(i, i + AGGREGATION_INTERVAL);
                if (chunk.length === 0) continue;

                // Sum the values based on the provided valueKey
                const totalChunkValue = chunk.reduce((sum, epoch) => {
                    // Ensure the value is a number, default to 0 if not
                    const epochValue = typeof epoch[valueKey] === 'number' ? epoch[valueKey] : 0;
                    return sum + (epochValue as number); 
                }, 0);

                const avgValue = totalChunkValue / chunk.length;
                const startEpoch = chunk[0].epoch;
                const endEpoch = chunk[chunk.length - 1].epoch;

                aggregatedData.push({
                    epoch: startEpoch, // Use start epoch for positioning
                    reward: avgValue, // Use the generic 'reward' key for the chart
                    label: `Epochs ${startEpoch}-${endEpoch} (Avg)`, // Label for tooltip
                });
            }
            return aggregatedData;
        } else {
            // --- Use Raw Data --- 
            return sortedEpochs.map((epoch) => ({
                epoch: epoch.epoch,
                reward: typeof epoch[valueKey] === 'number' ? epoch[valueKey] as number : 0, // Use generic 'reward' key
            }));
        }
    }, [rawData, valueKey]);

    return processedChartData;
} 