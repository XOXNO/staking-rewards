/**
 * @file validators.ts
 * @description Utility functions for validation.
 * @module lib/utils
 */

/**
 * Basic validation for wallet addresses (Elrond erd... or Ethereum 0x...).
 * TODO: Implement more robust validation.
 * @param address - The wallet address string to validate.
 * @returns True if the address format seems valid, false otherwise.
 */
export const validateAddress = (address: string): boolean => {
    if (!address) return false;
    const trimmedAddress = address.trim();
    // Basic checks - Elrond addresses start with 'erd1' and are 62 chars long
    // Ethereum addresses start with '0x' and are 42 chars long
    const isErd = trimmedAddress.startsWith('erd1') && trimmedAddress.length === 62;
    const isEth = trimmedAddress.startsWith('0x') && trimmedAddress.length === 42;
    // Add checks for other potential address formats if needed
    return isErd || isEth;
}; 