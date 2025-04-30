import { useState, useEffect } from 'react';
import { CHART_COLORS } from '@/lib/constants/chartColors';
import { getWalletColorMap } from '@/lib/utils/chartUtils';

const STORAGE_KEY = 'wallet-colors';

export interface UseWalletColorsReturn {
  walletColorMap: Record<string, string>;
  setWalletColor: (address: string, color: string) => void;
  resetWalletColors: () => void;
}

// Fonction utilitaire pour obtenir les couleurs sauvegardées
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

// Fonction utilitaire pour sauvegarder les couleurs
function setStorageValue(key: string, value: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

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
      // Génère un nouveau mapping en tenant compte des couleurs existantes
      const newColorMap = getWalletColorMap(addresses, CHART_COLORS.categorical, prev);
      
      // Sauvegarde dans le localStorage
      setStorageValue(STORAGE_KEY, newColorMap);
      
      return newColorMap;
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