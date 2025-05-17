/**
 * @file WalletDistribution.tsx
 * @description Composant pour afficher la répartition des récompenses entre les wallets.
 * @module components/dashboard/WalletDistribution
 */

import React from 'react';
import { shortenAddress } from '@/lib/utils/formatters';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';
import { Separator } from '@/components/ui/separator';
import { useStaking } from '@/lib/context/StakingContext';

interface IWalletDistributionProps {
  walletAmounts: Record<string, number>;
  className?: string;
}

export const WalletDistribution: React.FC<IWalletDistributionProps> = ({
  walletAmounts,
  className
}) => {
  // Récupérer les couleurs depuis le contexte
  const { state: { walletColorMap } } = useStaking();

  // Calculer le total pour obtenir les pourcentages
  const total = Object.values(walletAmounts).reduce((sum, amount) => sum + amount, 0);

  // Créer un tableau trié des wallets avec leurs montants et pourcentages
  const sortedWallets = Object.entries(walletAmounts)
    .map(([address, amount]) => ({
      address,
      amount,
      percentage: (amount / total) * 100
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <Separator className="mb-3 w-full" />
      <div className="flex flex-col space-y-1 w-[60%]">
        {/* Barre de progression */}
        <div className="h-1.5 w-full flex rounded-full overflow-hidden">
          {sortedWallets.map(({ address, percentage }, index) => (
            <Tooltip key={address}>
              <TooltipTrigger asChild>
                <div
                  className="h-full transition-all hover:opacity-80"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: walletColorMap[address],
                    marginLeft: index === 0 ? 0 : '-1px', // Éviter les espaces entre les segments
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-semibold">{shortenAddress(address)}</div>
                  <div>{percentage.toFixed(1)}%</div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Légende en ligne */}
        <div className="flex justify-between text-xs">
          {sortedWallets.map(({ address, percentage }, index) => (
            <div 
              key={address} 
              className="flex items-center gap-1.5"
              style={{
                width: `${percentage}%`,
                minWidth: 'fit-content',
                marginLeft: index === 0 ? 0 : '8px'
              }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: walletColorMap[address] }}
              />
              <span className="font-medium whitespace-nowrap">{shortenAddress(address)}</span>
              <span className="text-muted-foreground whitespace-nowrap">({percentage.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};