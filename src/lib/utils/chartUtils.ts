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

    // Process all wallets
    wallets.forEach(wallet => {
      const value = Number(epochData[wallet] || 0);
      // Update running total regardless of value
      walletRunningTotals[wallet] += value;
      // Add to result if it has a value
      if (walletRunningTotals[wallet] > 0) {
        cumulativeEntry[wallet] = optimizeNumber(walletRunningTotals[wallet]);
      }
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
    // Calculate first the total
    let totalForEpoch = 0;
    const epochEntries: [string, number][] = [];
    
    // Collect wallets with non-zero values
    wallets.forEach(wallet => {
      const value = Number(epochData[wallet] || 0);
      if (value !== 0) {
        epochEntries.push([wallet, optimizeNumber(value)]);
        totalForEpoch += value;
      }
    });
    
    // Build the final object with the correct type
    const resultEntry: { 
      epoch: number; 
      _total: number;
      [wallet: string]: number | string;
    } = {
      epoch: epochData.epoch,
      _total: optimizeNumber(totalForEpoch)
    };
    
    // Add non-zero wallets
    epochEntries.forEach(([wallet, value]) => {
      resultEntry[wallet] = value;
    });
    
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
    maxY = Math.max(...data.map(d => d._total as number));
  } else if (wallets && wallets.length > 0) {
    maxY = Math.max(
      ...data.map(d => 
        wallets.reduce((sum, w) => sum + Number(d[w] || 0), 0)
      )
    );
  } else {
    maxY = Math.max(
      ...data.map(d => 
        Object.entries(d)
          .filter(([key]) => key !== 'epoch')
          .reduce((sum, [_, val]) => sum + (typeof val === 'number' ? val : 0), 0)
      )
    );
  }
  
  const buffer = maxY * (displayMode === "cumulative" ? 0.1 : 0.2);
  return [0, optimizeNumber(maxY + buffer, 4)];
} 