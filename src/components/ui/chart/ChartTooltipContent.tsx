/**
 * @file ChartTooltipContent.tsx
 * @description Reusable component for chart tooltips
 */

import React, { useEffect, useRef, useState } from 'react';
import { shortenAddress } from '@/lib/utils/formatters';
import { CurrencyMode } from '@/components/dashboard/ChartToggles';

interface IChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    dataKey?: string | number;
    color?: string;
  }>;
  label?: string | number;
  walletColorMap: Record<string, string>;
  currencyMode?: CurrencyMode;
  coordinate?: { x?: number; y?: number };
  viewBox?: { width?: number; height?: number; x?: number; y?: number };
}

export const ChartTooltipContent: React.FC<IChartTooltipContentProps> = ({
  active,
  payload,
  label,
  walletColorMap,
  coordinate,
  viewBox,
  currencyMode = 'egld',
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
    
    // Calculate relative positions in the chart (in percentage)
    const relativeX = x / viewBox.width;
    const relativeY = y / viewBox.height;
    
    // Determine tooltip position based on quadrant
    let top = y;
    let left = x;
    
    // If we're in the right half of the chart
    if (relativeX > 0.5) {
      left = x - tooltipRect.width - 10; // 10px margin
    } else {
      left = x + 10; // 10px margin
    }
    
    // If we're in the bottom half of the chart
    if (relativeY > 0.5) {
      top = y - tooltipRect.height - 10;
    } else {
      top = y + 10;
    }

    // Ensure tooltip stays within chart bounds
    top = Math.max(0, Math.min(top, viewBox.height - tooltipRect.height));
    left = Math.max(0, Math.min(left, viewBox.width - tooltipRect.width));

    setPosition({
      top,
      left,
      opacity: 1,
    });
  }, [coordinate, viewBox]);

  if (!active || !payload || payload.length === 0) return null;

  // Filter entries with non-null values
  const nonZeroPayload = payload.filter(entry => {
    const value = typeof entry.value === 'number' ? entry.value : Number(entry.value);
    return value > 0;
  });

  if (nonZeroPayload.length === 0) return null;

  // Calculate total of non-null values
  const total = nonZeroPayload.reduce((sum, entry) => {
    const value = typeof entry.value === 'number' ? entry.value : Number(entry.value);
    return sum + value;
  }, 0);

  // Calculate date from epoch (24 hours per epoch)
  const epochStartDate = new Date('2020-07-30T15:00:00Z');
  const epochDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const epochDate = new Date(epochStartDate.getTime() + (Number(label) * epochDuration));
  const formattedDate = epochDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  });

  // Utility function to format a number with max 6 decimals
  const formatNumber = (amount: number): string => {
    const fixedAmount = amount.toFixed(6);
    return parseFloat(fixedAmount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  // Function to format percentage
  const formatPercentage = (value: number, total: number): string => {
    const percentage = (value / total) * 100;
    return percentage.toFixed(1) + '%';
  };

  // Get currency symbol based on mode
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currencySymbol = currencyMode === 'usd' ? '$' : 'EGLD';

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
          <span className="font-bold text-foreground">
            {currencyMode === 'usd' ? '$' : ''}{formatNumber(total)}{currencyMode === 'egld' ? ' EGLD' : ''}
          </span>
        </div>
      </div>
      
      {/* Only display wallets with non-null values */}
      {nonZeroPayload.map(entry => {
        const wallet = typeof entry.name === 'string' ? entry.name : '';
        const color = wallet ? walletColorMap[wallet] : '#888';
        const value = typeof entry.value === 'number' ? entry.value : Number(entry.value);
        const percentage = formatPercentage(value, total);
        
        return (
          <div key={wallet} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium" style={{ color }}>
                {currencyMode === 'usd' ? '$' : ''}{formatNumber(value)}{currencyMode === 'egld' ? ' EGLD' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {shortenAddress(wallet)}
              </span>
              <span className="text-sm font-medium" style={{ color }}>
                ({percentage})
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChartTooltipContent; 