/**
 * @file EpochStats.tsx
 * @description Reusable component to display epoch statistics (min, max, average)
 * @module components/dashboard/EpochStats
 */

import React from 'react';
import { formatEgld } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

export interface IEpochStats {
  min: number;
  max: number;
  avg: number;
}

interface IEpochStatsProps {
  stats7: IEpochStats;
  stats30: IEpochStats;
  showMinMax?: boolean;
  className?: string;
}

export const EpochStats: React.FC<IEpochStatsProps> = ({ 
  stats7, 
  stats30, 
  showMinMax = true,
  className
}) => {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-sm", className)}>
      <div className="border-b sm:border-b-0 sm:border-r border-border/50 pb-4 sm:pb-0 sm:pr-6">
        <p className="text-muted-foreground mb-2 font-medium">Last 7 Epochs</p>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg:</span>
          <span className="font-mono">{formatEgld(stats7.avg)}</span>
        </div>
        {showMinMax && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min:</span>
              <span className="font-mono">{formatEgld(stats7.min)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max:</span>
              <span className="font-mono">{formatEgld(stats7.max)}</span>
            </div>
          </>
        )}
      </div>
      <div>
        <p className="text-muted-foreground mb-2 font-medium">Last 30 Epochs</p>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg:</span>
          <span className="font-mono">{formatEgld(stats30.avg)}</span>
        </div>
        {showMinMax && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min:</span>
              <span className="font-mono">{formatEgld(stats30.min)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max:</span>
              <span className="font-mono">{formatEgld(stats30.max)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EpochStats; 