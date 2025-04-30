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

/**
 * Trouve une couleur non utilisée dans la palette.
 * @param usedColors Set des couleurs déjà utilisées
 * @param palette Tableau des couleurs disponibles
 * @returns Une couleur non utilisée ou la première couleur si toutes sont utilisées
 */
export function findUnusedColor(usedColors: Set<string>, palette: string[]): string {
  // Cherche une couleur non utilisée
  const unusedColor = palette.find(color => !usedColors.has(color));
  // Si toutes les couleurs sont utilisées, retourne la première couleur
  return unusedColor || palette[0];
}

/**
 * Génère un mapping wallet -> couleur à partir d'une liste de wallets et d'une palette de couleurs.
 * @param wallets Liste des adresses de wallets
 * @param palette Tableau de couleurs hexadécimales
 * @param existingColorMap Mapping existant des couleurs (optionnel)
 * @returns Un objet { [wallet]: couleur }
 */
export function getWalletColorMap(
  wallets: string[], 
  palette: string[],
  existingColorMap: Record<string, string> = {}
): Record<string, string> {
  const colorMap: Record<string, string> = { ...existingColorMap };
  const usedColors = new Set(Object.values(colorMap));

  wallets.forEach(wallet => {
    // Si le wallet n'a pas déjà une couleur, lui en attribuer une non utilisée
    if (!colorMap[wallet]) {
      colorMap[wallet] = findUnusedColor(usedColors, palette);
      usedColors.add(colorMap[wallet]);
    }
  });

  return colorMap;
} 