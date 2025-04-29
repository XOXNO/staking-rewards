/**
 * @file chartUtils.ts
 * @description Utilitaires pour les graphiques et la manipulation de données de graphiques
 */

/**
 * Calcule les données cumulatives à partir des données par epoch
 * @param data Données par epoch avec valeurs par wallet
 * @param wallets Liste des wallets à inclure
 * @returns Données cumulatives avec les mêmes wallets
 */
export function calculateCumulativeData(
  data: Array<{ epoch: number; [wallet: string]: number | string }>,
  wallets: string[]
): Array<{ epoch: number; [wallet: string]: number }> {
  const cumulativeData = data.map((epochData, index) => {
    const cumulativeEntry: { epoch: number; [wallet: string]: number } = {
      epoch: epochData.epoch,
    };

    wallets.forEach(wallet => {
      // Calculer le cumulatif pour ce wallet jusqu'à cet epoch
      const cumulativeAmount = data
        .slice(0, index + 1)
        .reduce((sum, entry) => sum + Number(entry[wallet] || 0), 0);
      
      cumulativeEntry[wallet] = cumulativeAmount;
    });

    return cumulativeEntry;
  });

  return cumulativeData;
} 