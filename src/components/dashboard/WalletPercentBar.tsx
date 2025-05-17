/**
 * @file WalletPercentBar.tsx
 * @description Affiche une barre de pourcentage par wallet avec couleur, montant et pourcentage.
 * @module components/dashboard/WalletPercentBar
 */

import React from 'react';
import { shortenAddress, formatEgld } from '@/lib/utils/formatters';

interface IWalletPercentBarProps {
  walletAmounts: Record<string, number>; // { wallet: montant }
  walletColorMap: Record<string, string>; // { wallet: couleur }
  className?: string;
}

/**
 * Affiche une barre horizontale avec le pourcentage et le montant de chaque wallet sélectionné.
 * @param walletAmounts - Mapping wallet -> montant total
 * @param walletColorMap - Mapping wallet -> couleur
 * @param className - Classe CSS optionnelle
 */
export const WalletPercentBar: React.FC<IWalletPercentBarProps> = ({
  walletAmounts,
  walletColorMap,
  className,
}) => {
  const total = Object.values(walletAmounts).reduce((sum, v) => sum + v, 0);
  if (total === 0) return null;

  // Trie tous les wallets pour la barre (même ceux à 0)
  const sortedAll = Object.entries(walletAmounts).sort((a, b) => b[1] - a[1]);
  // Trie et filtre pour la légende (montant > 0)
  const sortedNonZero = sortedAll.filter(([, amount]) => amount > 0);

  if (sortedAll.length < 2) return null; // Affiche seulement si au moins 2 wallets au total

  return (
    <div className={`w-full flex flex-col items-center gap-2 ${className || ''} max-w-xl mx-auto`}>
      {/* Barre centrale (tous wallets, même à 0) */}
      <div className="flex w-full h-3 rounded-full overflow-hidden border border-border/50 bg-muted/30">
        {sortedAll.map(([wallet, amount]) => {
          const percent = (amount / total) * 100;
          return (
            <div
              key={wallet}
              style={{
                width: `${percent}%`,
                backgroundColor: walletColorMap[wallet] || '#ccc',
              }}
              className="h-full transition-all duration-300"
              title={`${shortenAddress(wallet)}: ${formatEgld(amount)} (${percent.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      {/* Légende horizontale sous la barre (seulement wallets > 0) */}
      <div className="flex flex-row flex-wrap justify-center gap-6 mt-1 w-full">
        {sortedNonZero.map(([wallet, amount]) => {
          // Adresse : 5 premières lettres, ... , 4 dernières lettres
          const addr = wallet ? `${wallet.slice(0,5)}...${wallet.slice(-4)}` : '';
          return (
            <div key={wallet} className="flex flex-col items-center min-w-[60px]">
              <span className="inline-block w-3 h-3 rounded-full border mb-1" style={{ backgroundColor: walletColorMap[wallet] || '#ccc' }} />
              <span className="font-mono text-xs text-center truncate max-w-[80px]">{addr}</span>
              <span className="font-mono text-xs text-muted-foreground text-center">{(amount).toFixed(2)} EGLD</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WalletPercentBar; 