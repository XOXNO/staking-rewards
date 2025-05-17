import { useState, useEffect } from 'react';
import { CHART_COLORS } from '@/lib/constants/chartColors';
import { getWalletColorMap } from '@/lib/utils/chartUtils';

const STORAGE_KEY = 'wallet-colors';

export interface UseWalletColorsReturn {
  walletColorMap: Record<string, string>;
  setWalletColor: (address: string, color: string) => void;
  resetWalletColors: () => void;
}

// Utility function to get saved colors
function getStorageValue(key: string): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
}

// Utility function to save colors
function setStorageValue(key: string, value: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

export function useWalletColors(addresses: string[]): UseWalletColorsReturn {
  // Local state for wallet -> color mapping
  const [walletColorMap, setWalletColorMap] = useState<Record<string, string>>({});
  
  // Effect to load saved colors when component mounts
  useEffect(() => {
    const savedColors = getStorageValue(STORAGE_KEY);
    if (savedColors) {
      setWalletColorMap(savedColors);
    }
  }, []);

  // Update the mapping when address list changes
  useEffect(() => {
    setWalletColorMap(prev => {
      // Generate a new mapping considering existing colors
      const newColorMap = getWalletColorMap(addresses, CHART_COLORS.categorical, prev);
      
      // Save to localStorage
      setStorageValue(STORAGE_KEY, newColorMap);
      
      return newColorMap;
    });
  }, [addresses]);

  // Function to change a wallet's color
  const setWalletColor = (address: string, color: string) => {
    setWalletColorMap(prev => {
      const updated = { ...prev, [address]: color };
      setStorageValue(STORAGE_KEY, updated);
      return updated;
    });
  };

  // Function to reset all colors
  const resetWalletColors = () => {
    const newColorMap = getWalletColorMap(addresses, CHART_COLORS.categorical);
    setStorageValue(STORAGE_KEY, newColorMap);
    setWalletColorMap(newColorMap);
  };

  return {
    walletColorMap,
    setWalletColor,
    resetWalletColors,
  };
} 