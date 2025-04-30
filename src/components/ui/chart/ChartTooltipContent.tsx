/**
 * @file ChartTooltipContent.tsx
 * @description Composant réutilisable pour les tooltips des graphiques
 */

import React, { useEffect, useRef, useState } from 'react';
import { TooltipProps } from 'recharts';
import { formatEgld, shortenAddress } from '@/lib/utils/formatters';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface IChartTooltipContentProps extends TooltipProps<ValueType, NameType> {
  walletColorMap: Record<string, string>;
}

export const ChartTooltipContent: React.FC<IChartTooltipContentProps> = ({
  active,
  payload,
  label,
  walletColorMap,
  coordinate,
  viewBox,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    opacity: 0,
  });

  useEffect(() => {
    if (!tooltipRef.current || !coordinate || !viewBox?.width || !viewBox?.height) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const { x = 0, y = 0 } = coordinate;
    
    // Calculer les positions relatives dans le graphique (en pourcentage)
    const relativeX = x / viewBox.width;
    const relativeY = y / viewBox.height;
    
    // Déterminer la position du tooltip en fonction du quadrant
    let top = y;
    let left = x;
    
    // Si on est dans la moitié droite du graphique
    if (relativeX > 0.5) {
      left = x - tooltipRect.width - 10; // 10px de marge
    } else {
      left = x + 10; // 10px de marge
    }
    
    // Si on est dans la moitié basse du graphique
    if (relativeY > 0.5) {
      top = y - tooltipRect.height - 10;
    } else {
      top = y + 10;
    }

    // Assurer que le tooltip reste dans les limites du graphique
    top = Math.max(0, Math.min(top, viewBox.height - tooltipRect.height));
    left = Math.max(0, Math.min(left, viewBox.width - tooltipRect.width));

    setPosition({
      top,
      left,
      opacity: 1,
    });
  }, [coordinate, viewBox]);

  if (!active || !payload || payload.length === 0) return null;

  // Calculer le total des valeurs
  const total = payload.reduce((sum, entry) => {
    const value = typeof entry.value === 'number' ? entry.value : Number(entry.value);
    return sum + value;
  }, 0);

  // Calculer la date à partir de l'epoch (24 heures par epoch)
  const epochStartDate = new Date('2020-07-30T15:00:00Z');
  const epochDuration = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
  const epochDate = new Date(epochStartDate.getTime() + (Number(label) * epochDuration));
  const formattedDate = epochDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  // Fonction utilitaire pour formater un nombre avec 6 décimales max
  const formatNumber = (amount: number): string => {
    const fixedAmount = amount.toFixed(6);
    return parseFloat(fixedAmount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  return (
    <div 
      ref={tooltipRef}
      className="bg-background border border-border rounded-lg shadow-lg p-3 absolute transition-opacity duration-200"
      style={{
        top: position.top,
        left: position.left,
        opacity: position.opacity,
        pointerEvents: 'none',
      }}
    >
      <div className="font-semibold mb-2 border-b border-border pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span>Epoch {label}</span>
            <span className="text-sm text-muted-foreground">({formattedDate})</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>Total:</span>
          <span className="font-bold text-foreground">{formatNumber(total)} EGLD</span>
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
                {formatNumber(value)}
              </span>
              <span className="text-muted-foreground text-sm">({shortenAddress(wallet)})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChartTooltipContent; 