/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @file chartUtils.ts
 * @description Utilities for charts and chart data manipulation
 */

/**
 * Optimizes a number for storage by limiting decimal places
 * @param value Value to optimize
 * @param decimals Number of decimals to keep
 */
function optimizeNumber(value: number, decimals: number = 6): number {
  return Number(value.toFixed(decimals));
}

/**
 * Calculates cumulative data from epoch data
 * @param data Epoch data with values by wallet
 * @param wallets List of wallets to include
 * @returns Cumulative data with the same wallets
 */
export function calculateCumulativeData(
  data: Array<{ epoch: number; [wallet: string]: number | string }>,
  wallets: string[]
): Array<{ epoch: number; [wallet: string]: number }> {
  const walletRunningTotals: Record<string, number> = {};
  wallets.forEach(wallet => {
    walletRunningTotals[wallet] = 0;
  });

  // Sort data by epoch to ensure correct cumulative calculation
  const sortedData = [...data].sort((a, b) => a.epoch - b.epoch);

  const result = sortedData.map(epochData => {
    const cumulativeEntry: { epoch: number; [wallet: string]: number } = {
      epoch: epochData.epoch,
    };

    // Process all wallets - always include all wallets for consistent data shape
    wallets.forEach(wallet => {
      const value = Number(epochData[wallet] || 0);
      // Update running total regardless of value
      walletRunningTotals[wallet] += value;
      // Always include wallet in result for consistent chart data shape
      cumulativeEntry[wallet] = optimizeNumber(walletRunningTotals[wallet]);
    });

    return cumulativeEntry;
  });

  return result;
}

/**
 * Finds an unused color in the palette.
 * @param usedColors Set of already used colors
 * @param palette Array of available colors
 * @returns An unused color or the first color if all are used
 */
export function findUnusedColor(usedColors: Set<string>, palette: string[]): string {
  // Find an unused color
  const unusedColor = palette.find(color => !usedColors.has(color));
  // If all colors are used, return the first color
  return unusedColor || palette[0];
}

/**
 * Generates a wallet -> color mapping from a list of wallets and a color palette.
 * @param wallets List of wallet addresses
 * @param palette Array of hexadecimal colors
 * @param existingColorMap Existing color mapping (optional)
 * @returns An object { [wallet]: color }
 */
export function getWalletColorMap(
  wallets: string[], 
  palette: string[],
  existingColorMap: Record<string, string> = {}
): Record<string, string> {
  const colorMap: Record<string, string> = { ...existingColorMap };
  const usedColors = new Set(Object.values(colorMap));

  wallets.forEach(wallet => {
    if (!colorMap[wallet]) {
      colorMap[wallet] = findUnusedColor(usedColors, palette);
      usedColors.add(colorMap[wallet]);
    }
  });
  
  return colorMap;
}

/**
 * Pre-calculates the sum of rewards for each epoch
 * @param data Epoch data with values by wallet
 * @param wallets List of wallets to include in the calculation
 * @returns An array with the same epochs but with pre-calculated sums
 */
export function precalculateEpochSums(
  data: Array<{ epoch: number; [wallet: string]: number | string }>,
  wallets: string[]
): Array<{ epoch: number; [wallet: string]: number | string; _total: number }> {
  const result = data.map(epochData => {
    // Calculate the total and include all wallets for consistent data shape
    let totalForEpoch = 0;

    // Build the final object with the correct type
    const resultEntry: {
      epoch: number;
      _total: number;
      [wallet: string]: number | string;
    } = {
      epoch: epochData.epoch,
      _total: 0 // Will be updated below
    };

    // Include all wallets for consistent chart data shape
    wallets.forEach(wallet => {
      const value = Number(epochData[wallet] || 0);
      resultEntry[wallet] = optimizeNumber(value);
      totalForEpoch += value;
    });

    resultEntry._total = optimizeNumber(totalForEpoch);

    return resultEntry;
  });

  return result;
}

/**
 * Calculates the Y axis limits based on data
 * @param data Data with totals (either pre-calculated, or to calculate)
 * @param displayMode Display mode (cumulative or daily)
 * @param wallets List of wallets (used if no pre-calculated totals)
 * @returns Limits in the form [min, max]
 */
export function calculateYDomain(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Array<{ _total?: number; [key: string]: any }>,
  displayMode: string,
  wallets?: string[]
): [number, number] {
  if (!data || data.length === 0) return [0, 1];

  let maxY: number;

  if ('_total' in (data[0] || {})) {
    // Use reduce instead of Math.max(...spread) to avoid stack overflow with large datasets
    maxY = data.reduce((max, d) => Math.max(max, d._total as number), 0);
  } else if (wallets && wallets.length > 0) {
    // Use reduce instead of Math.max(...spread) to avoid stack overflow with large datasets
    maxY = data.reduce((max, d) => {
      const epochTotal = wallets.reduce((sum, w) => sum + Number(d[w] || 0), 0);
      return Math.max(max, epochTotal);
    }, 0);
  } else {
    // Use reduce instead of Math.max(...spread) to avoid stack overflow with large datasets
    maxY = data.reduce((max, d) => {
      const epochTotal = Object.entries(d)
        .filter(([key]) => key !== 'epoch')
        .reduce((sum, [, val]) => sum + (typeof val === 'number' ? val : 0), 0);
      return Math.max(max, epochTotal);
    }, 0);
  }

  const buffer = maxY * (displayMode === "cumulative" ? 0.1 : 0.2);
  return [0, optimizeNumber(maxY + buffer, 4)];
}

/**
 * Reduces the number of data points for more efficient rendering
 * @param data - The data points to reduce
 * @param targetPoints - Target number of points (default 200)
 * @param useLast - If true, use the last value in each chunk (for cumulative data).
 *                  If false, use the average (for daily data).
 */
export function reduceDataPoints<T extends { epoch: number; [key: string]: number | string }>(
  data: T[],
  targetPoints: number = 200,
  useLast: boolean = false
): T[] {
  if (data.length <= targetPoints) return data;

  const step = Math.ceil(data.length / targetPoints);
  const result: T[] = [];

  for (let i = 0; i < data.length; i += step) {
    const chunk = data.slice(i, i + step);

    if (useLast) {
      // For cumulative data, use the last point in the chunk (preserves running total)
      const lastPoint = chunk[chunk.length - 1];
      // Copy the entire last point to preserve all fields including _total
      result.push({ ...lastPoint } as T);
    } else {
      // For daily data, calculate the average for each wallet
      const aggregated: { epoch: number; [key: string]: number | string } = {
        epoch: chunk[0].epoch,
      };
      chunk.forEach((point) => {
        Object.entries(point).forEach(([key, value]) => {
          if (key === "epoch") return;
          if (typeof value === "number") {
            if (!aggregated[key]) aggregated[key] = 0;
            aggregated[key] = (aggregated[key] as number) + value / chunk.length;
          }
        });
      });
      // Optimize numbers
      Object.entries(aggregated).forEach(([key, value]) => {
        if (key !== "epoch" && typeof value === "number") {
          aggregated[key] = optimizeNumber(value);
        }
      });
      result.push(aggregated as T);
    }
  }

  return result;
}

/**
 * Aggregates epoch data by a specified granularity (number of epochs)
 * @param data Epoch data with values by wallet
 * @param granularity Number of epochs to aggregate (1 = no aggregation, 7 = weekly, etc.)
 * @param wallets List of wallets to include
 * @param isCumulative If true, use last value; if false, sum values
 * @returns Aggregated data
 */
export function aggregateByGranularity<T extends { epoch: number; [key: string]: number | string }>(
  data: T[],
  granularity: number,
  wallets: string[],
  isCumulative: boolean = false
): T[] {
  if (data.length === 0) return [];
  if (granularity === 1) return [...data]; // Return new array reference

  // Sort by epoch ascending
  const sorted = [...data].sort((a, b) => a.epoch - b.epoch);
  const result: T[] = [];

  for (let i = 0; i < sorted.length; i += granularity) {
    const chunk = sorted.slice(i, Math.min(i + granularity, sorted.length));

    if (isCumulative) {
      // For cumulative, take the last value in the chunk
      result.push({ ...chunk[chunk.length - 1] } as T);
    } else {
      // For daily, sum values across the chunk
      const aggregated: { epoch: number; [key: string]: number | string } = {
        epoch: chunk[0].epoch, // Use first epoch as the label
      };

      // Sum all wallet values
      wallets.forEach(wallet => {
        let sum = 0;
        chunk.forEach(point => {
          sum += Number(point[wallet] || 0);
        });
        aggregated[wallet] = optimizeNumber(sum);
      });

      // Calculate _total if present
      if ('_total' in chunk[0]) {
        let totalSum = 0;
        chunk.forEach(point => {
          totalSum += Number((point as { _total?: number })._total || 0);
        });
        aggregated._total = optimizeNumber(totalSum);
      }

      result.push(aggregated as T);
    }
  }

  return result;
} 