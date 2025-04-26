/**
 * @file formatters.ts
 * @description Utility functions for formatting data (addresses, numbers, dates).
 * @module lib/utils
 */

/**
 * Shortens a wallet address for display.
 * 
 * @param address - The full wallet address string.
 * @param startChars - Number of characters to show from the start.
 * @param endChars - Number of characters to show from the end.
 * @returns A shortened address string like "0x123...abc" or "erd1...xyz".
 */
export const shortenAddress = (
  address: string | null | undefined,
  startChars = 6,
  endChars = 4
): string => {
  if (!address) {
    return "";
  }
  if (address.length <= startChars + endChars + 3) {
    return address; // Address is already short enough
  }
  const start = address.substring(0, startChars);
  const end = address.substring(address.length - endChars);
  return `${start}...${end}`;
};

/**
 * Formats a numeric value as EGLD currency string.
 * 
 * @param amount - The numeric amount (can be null or undefined).
 * @returns A formatted string like "1,234.567890 EGLD" or "-" if input is invalid.
 */
export const formatEgld = (amount: number | null | undefined): string => {
    // Check for null, undefined, or NaN before formatting
    if (amount === null || amount === undefined || isNaN(amount)) return '-'; 
    
    const fixedAmount = amount.toFixed(6);
    const formatted = parseFloat(fixedAmount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
    });
    return `${formatted} EGLD`;
}; 