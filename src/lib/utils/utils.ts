/**
 * Génère un mapping wallet -> couleur à partir d'une liste de wallets et d'une palette de couleurs.
 * @param wallets Liste des adresses de wallets
 * @param palette Tableau de couleurs hexadécimales
 * @returns Un objet { [wallet]: couleur }
 */
export function getWalletColorMap(wallets: string[], palette: string[]): Record<string, string> {
  const colorMap: Record<string, string> = {};
  wallets.forEach((wallet, idx) => {
    colorMap[wallet] = palette[idx % palette.length];
  });
  return colorMap;
} 