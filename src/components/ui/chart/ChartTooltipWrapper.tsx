/**
 * @file ChartTooltipWrapper.tsx
 * @description Wrapper for chart tooltips that properly handles Recharts types
 */

import React from 'react';
import { TooltipProps } from 'recharts';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

export type ChartPayload = {
  value: ValueType;
  name: string;
  color: string;
  payload: {
    epoch: number;
    [key: string]: number | string;
  };
};

interface IChartTooltipWrapperProps extends Omit<TooltipProps<ValueType, NameType>, 'payload'> {
  walletColorMap: Record<string, string>;
  displayMode: 'daily' | 'cumulative';
  viewMode: 'rewards' | 'staked';
  payload?: ChartPayload[];
}

export const ChartTooltipWrapper: React.FC<IChartTooltipWrapperProps> = ({
  active,
  payload,
  walletColorMap,
  displayMode,
  viewMode
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const epoch = payload[0].payload.epoch;
  const total = payload.reduce((sum, item) => {
    const value = item.value;
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);

  // Calculate date from epoch (24 hours per epoch)
  const epochStartDate = new Date('2020-07-30T15:00:00Z');
  const epochDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const epochDate = new Date(epochStartDate.getTime() + (epoch * epochDuration));
  const formattedDate = epochDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  });

  return (
    <div className="bg-background/90 backdrop-blur-sm border rounded-lg shadow-lg p-3 min-w-[200px]">
      <div className="text-sm font-medium mb-2">
        Epoch {epoch} <span className="text-xs text-muted-foreground">({formattedDate})</span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={`${entry.name}-${index}`} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}</span>
            </div>
            <span className="font-medium">
              {typeof entry.value === 'number' ? entry.value.toFixed(6) : entry.value}
            </span>
          </div>
        ))}
        <div className="border-t pt-1.5 mt-1.5 flex items-center justify-between text-sm font-semibold">
          <span>Total</span>
          <span>{total.toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
};

export default ChartTooltipWrapper; 