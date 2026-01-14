/**
 * @file GlobalStakedChart.tsx
 * @description Displays total staked amounts per epoch across all wallets.
 * @module components/charts/GlobalStakedChart
 */

"use client";

import React, { useRef } from "react";
import { useContainerDimensions } from "@/hooks/useContainerDimensions";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils/cn";
import { formatEgld, shortenAddress } from "@/lib/utils/formatters";
import { useStaking } from "@/lib/context/StakingContext/StakingContext";

interface IStakingDataPoint {
  epoch: number;
  [wallet: string]: number; // Montant total staké pour chaque wallet à cet epoch
}

interface IGlobalStakedChartProps {
  stakingData: IStakingDataPoint[]; // Renommé pour clarifier que c'est du staking, pas des rewards
  walletColorMap?: Record<string, string>; // Rendu optionnel car on utilise maintenant le contexte
  className?: string;
}

/**
 * Renders an area chart showing total staked EGLD amounts per epoch for each wallet.
 */
export const GlobalStakedChart: React.FC<IGlobalStakedChartProps> = ({
  stakingData,
  walletColorMap: propWalletColorMap,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerDimensions(containerRef);

  const {
    state: { walletColorMap: contextWalletColorMap },
  } = useStaking();

  // Utiliser les couleurs du contexte, avec fallback sur les props si nécessaire
  const walletColorMap = contextWalletColorMap || propWalletColorMap || {};

  if (!stakingData || stakingData.length === 0) {
    return (
      <div
        className={cn(
          "text-center text-muted-foreground text-sm py-8",
          className
        )}
      >
        No staked amount data available.
      </div>
    );
  }

  // Récupérer la liste des wallets
  const wallets = Object.keys(walletColorMap);

  // Calculer le domaine Y avec un buffer de 5% (moins que pour les rewards car les changements sont moins fréquents)
  const maxY = Math.max(
    ...stakingData.map((d) =>
      wallets.reduce((sum, wallet) => sum + (d[wallet] || 0), 0)
    )
  );
  const buffer = maxY * 0.05;
  const yDomain: [number, number] = [0, maxY + buffer];

  return (
    <div ref={containerRef} className={cn("w-full overflow-hidden", className)} style={{ minHeight: 450 }}>
      <AreaChart
        width={width}
        height={450}
        data={stakingData}
        margin={{
          top: 10,
          right: 10,
          left: 5,
          bottom: 15,
        }}
      >
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="hsl(var(--border) / 0.5)"
        />
        <XAxis
          dataKey="epoch"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={10}
          minTickGap={80}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={10}
          domain={yDomain}
          tickFormatter={(value) => formatEgld(value)}
          allowDecimals={true}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload) return null;

            const total = payload.reduce((sum, entry) => {
              return sum + ((entry.value as number) || 0);
            }, 0);

            const epochStartDate = new Date("2020-07-30T15:00:00Z");
            const epochDuration = 24 * 60 * 60 * 1000;
            const epochDate = new Date(
              epochStartDate.getTime() + Number(label) * epochDuration
            );
            const formattedDate = epochDate.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            });

            return (
              <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                <div className="font-semibold mb-2 border-b border-border pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>Epoch {label}</span>
                      <span className="text-sm text-muted-foreground">
                        ({formattedDate})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Total Staked:</span>
                    <span className="font-bold text-foreground">
                      {formatEgld(total)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {payload.map((entry) => {
                    const wallet = entry.dataKey as string;
                    const color = walletColorMap[wallet];
                    const value = entry.value as number;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return (
                      <div
                        key={wallet}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium" style={{ color }}>
                          {formatEgld(value)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({shortenAddress(wallet)} - {percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }}
        />
        {wallets.map((wallet) => (
          <Area
            key={wallet}
            type="monotone"
            dataKey={wallet}
            stackId="a"
            stroke={walletColorMap[wallet]}
            fill={walletColorMap[wallet]}
            fillOpacity={0.2}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </div>
  );
};
