/**
 * @file ChartTooltipContent.tsx
 * @description Composant réutilisable pour les tooltips des graphiques
 */

import React from 'react';
import { TooltipProps } from 'recharts';
import { formatEgld } from '@/lib/utils/formatters';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface IChartTooltipContentProps extends TooltipProps<ValueType, NameType> {
  walletColorMap: Record<string, string>;
}

export const ChartTooltipContent: React.FC<IChartTooltipContentProps> = ({
  active,
  payload,
  label,
  walletColorMap,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  // Calculer le total des valeurs
  const total = payload.reduce((sum, entry) => {
    const value = typeof entry.value === 'number' ? entry.value : Number(entry.value);
    return sum + value;
  }, 0);

  // Calculer la date à partir de l'epoch (environ 6 minutes par epoch)
  const epochStartDate = new Date('2020-07-30T15:00:00Z'); // Date de début des epochs MultiversX
  const epochDuration = 6 * 60 * 1000; // 6 minutes en millisecondes
  const epochDate = new Date(epochStartDate.getTime() + (Number(label) * epochDuration));
  const formattedDate = epochDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
      <div className="font-semibold mb-2 border-b border-border pb-2 space-y-1">
        <div className="flex items-center justify-between">
          <span>Epoch {label}</span>
          <span className="text-sm text-muted-foreground">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>Total:</span>
          <span className="font-bold text-foreground">{formatEgld(total)} EGLD</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const wallet = typeof entry.name === 'string' ? entry.name : '';
          const color = wallet ? walletColorMap[wallet] : '#888';
          const value = typeof entry.value === 'number' ? entry.value : Number(entry.value);
          return (
            <div key={wallet} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium" style={{ color }}>
                {formatEgld(value)}
              </span>
              <span className="text-muted-foreground text-sm">({wallet})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChartTooltipContent; 