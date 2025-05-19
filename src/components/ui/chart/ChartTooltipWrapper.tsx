/**
 * @file ChartTooltipWrapper.tsx
 * @description Wrapper for chart tooltips that properly handles Recharts types
 */

import React from "react";
import { TooltipProps } from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import { CurrencyMode } from "@/components/dashboard/ChartToggles";
import { shortenAddress } from "@/lib/utils/formatters";

export type ChartPayload = {
  value: ValueType;
  name: string;
  color: string;
  payload: {
    epoch: number;
    [key: string]: number | string;
  };
};

interface IChartTooltipWrapperProps
  extends Omit<TooltipProps<ValueType, NameType>, "payload"> {
  walletColorMap: Record<string, string>;
  displayMode: "daily" | "cumulative";
  viewMode: "rewards" | "staked";
  currencyMode: CurrencyMode;
  payload?: ChartPayload[];
}

export const ChartTooltipWrapper: React.FC<IChartTooltipWrapperProps> = ({
  active,
  payload,
  walletColorMap,
  displayMode,
  viewMode,
  currencyMode,
}) => {
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

  // Format value based on currency mode
  const formatValue = (value: number) => {
    if (currencyMode === 'usd') {
      return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })}`;
    } else {
      return `${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })} EGLD`;
    }
  };

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Epoch {payload[0].payload.epoch}</p>
          {nonZeroPayload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {shortenAddress(entry.name)}
                </span>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {formatValue(typeof entry.value === 'number' ? entry.value : Number(entry.value))}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-2 border-t pt-1">
            <span className="text-sm font-medium">Total</span>
            <span className="text-sm font-medium tabular-nums">
              {formatValue(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartTooltipWrapper;
