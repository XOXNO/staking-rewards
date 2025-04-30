import { useState, useEffect } from 'react';
import { CHART_COLORS } from '@/lib/constants/chartColors';
import { getWalletColorMap } from '@/lib/utils/utils';

const STORAGE_KEY = 'wallet-colors';

export interface UseWalletColorsReturn {
  walletColorMap: Record<string, string>;
  setWalletColor: (address: string, color: string) => void;
  resetWalletColors: () => void;
}

// Fonction utilitaire pour accéder au localStorage de manière sûre
const getStorageValue = (key: string): Record<string, string> | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

// Fonction utilitaire pour sauvegarder dans le localStorage de manière sûre
const setStorageValue = (key: string, value: Record<string, string>): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

export function useWalletColors(addresses: string[]): UseWalletColorsReturn {
  // État local pour le mapping wallet -> couleur
  const [walletColorMap, setWalletColorMap] = useState<Record<string, string>>({});
  
  // Effet pour charger les couleurs sauvegardées au montage du composant
  useEffect(() => {
    const savedColors = getStorageValue(STORAGE_KEY);
    if (savedColors) {
      setWalletColorMap(savedColors);
    }
  }, []);

  // Met à jour le mapping quand la liste d'adresses change
  useEffect(() => {
    setWalletColorMap(prev => {
      // Génère un nouveau mapping automatique
      const autoMap = getWalletColorMap(addresses, CHART_COLORS.categorical);
      
      // Fusionne avec les couleurs existantes
      const merged: Record<string, string> = {};
      addresses.forEach(addr => {
        merged[addr] = prev[addr] || autoMap[addr];
      });

      // Sauvegarde dans le localStorage
      setStorageValue(STORAGE_KEY, merged);
      
      return merged;
    });
  }, [addresses]);

  // Fonction pour modifier la couleur d'un wallet
  const setWalletColor = (address: string, color: string) => {
    setWalletColorMap(prev => {
      const updated = { ...prev, [address]: color };
      setStorageValue(STORAGE_KEY, updated);
      return updated;
    });
  };

  // Fonction pour réinitialiser toutes les couleurs
  const resetWalletColors = () => {
    const autoMap = getWalletColorMap(addresses, CHART_COLORS.categorical);
    setStorageValue(STORAGE_KEY, autoMap);
    setWalletColorMap(autoMap);
  };

  return {
    walletColorMap,
    setWalletColor,
    resetWalletColors,
  };
} 