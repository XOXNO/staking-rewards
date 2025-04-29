/**
 * @file ProviderSidebar.tsx
 * @description Sidebar component to list and select staking providers.
 * @module components/dashboard/ProviderSidebar
 */

'use client';

import React from 'react';
import { useStaking } from '@/lib/context/StakingContext';
import Image from 'next/image';
import { IProviderWithIdentity } from '@/api/types/xoxno-rewards.types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { XIcon, ArrowDown, ArrowUp } from 'lucide-react';
import { shortenAddress } from '@/lib/utils/formatters';
import { Separator } from "@/components/ui/separator";

interface IProviderSidebarProps {
    providers: IProviderWithIdentity[] | undefined;
    selectedProviderAddress: string | null;
    onSelectProvider: (providerAddress: string | null) => void;
    onItemClick?: () => void;
    className?: string;
    totalRewardsPerProvider?: Record<string, number>;
    fullRewardsData?: Record<string, import('@/api/types/xoxno-rewards.types').IXoxnoUserRewardsResponse | null>;
    currentEpoch?: number;
}

/**
 * Renders a sidebar listing available staking providers.
 * Allows selecting a provider to view its details.
 * Includes wallet management controls on mobile.
 */
export const ProviderSidebar: React.FC<IProviderSidebarProps> = ({
    providers,
    selectedProviderAddress,
    onSelectProvider,
    onItemClick,
    className,
    totalRewardsPerProvider,
    fullRewardsData,
    currentEpoch,
}) => {
    const {
        state,
        toggleSelectedAddress,
        removeAddress,
        dispatch,
    } = useStaking();
    const { addedAddresses, selectedAddresses } = state;
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

    const handleSelectAll = React.useCallback(() => {
        dispatch({ type: 'SET_SELECTED_ADDRESSES', payload: { addresses: addedAddresses } });
    }, [dispatch, addedAddresses]);

    const handleDeselectAll = React.useCallback(() => {
        dispatch({ type: 'SET_SELECTED_ADDRESSES', payload: { addresses: [] } });
    }, [dispatch]);

    const handleItemClick = (providerAddress: string | null) => {
        onSelectProvider(providerAddress);
        onItemClick?.();
    };
    
    const sortedProviders = React.useMemo(() => {
      if (!providers) return [];
      return [...providers].sort((a, b) => {
        const aReward = totalRewardsPerProvider?.[a.provider] ?? 0;
        const bReward = totalRewardsPerProvider?.[b.provider] ?? 0;
        if (aReward === bReward) {
          // fallback: tri alphabétique
          return (a.identityInfo?.name || a.identity || a.provider)
            .localeCompare(b.identityInfo?.name || b.identity || b.provider);
        }
        return sortOrder === 'asc' ? aReward - bReward : bReward - aReward;
      });
    }, [providers, totalRewardsPerProvider, sortOrder]);

    const isCurrentlyStaked = (provider: IProviderWithIdentity) => {
      if (!fullRewardsData || !currentEpoch) return false;
      // Agrège tous les epochs de tous les wallets sélectionnés pour ce provider
      let lastEpoch: number | undefined = undefined;
      Object.values(fullRewardsData).forEach((rewards) => {
        const epochs = rewards?.providersFullRewardsData?.[provider.provider];
        if (epochs && epochs.length > 0) {
          const maxEpoch = Math.max(...epochs.map(e => e.epoch));
          if (lastEpoch === undefined || maxEpoch > lastEpoch) {
            lastEpoch = maxEpoch;
          }
        }
      });
      return lastEpoch !== undefined && lastEpoch >= currentEpoch - 1;
    };

    return (
        <ScrollArea className={`h-full ${className}`}>
            <div className="md:hidden p-4 border-b border-border/50">
                <h3 className="text-base font-semibold tracking-tight mb-3">Manage Wallets</h3>
                <div className="flex flex-col gap-2 mb-3 max-h-48 overflow-y-auto pr-2">
                    {addedAddresses.map((address) => (
                        <div key={`sidebar-wallet-${address}`} className="flex items-center gap-2 border rounded-md px-2.5 py-1.5 bg-muted/50 text-xs">
                            <Checkbox
                                id={`sidebar-mgmt-wallet-${address}`}
                                checked={selectedAddresses.includes(address)}
                                onCheckedChange={() => toggleSelectedAddress(address)}
                                aria-label={`Select wallet ${shortenAddress(address)}`}
                                className="h-4 w-4"
                            />
                            <Label 
                                htmlFor={`sidebar-mgmt-wallet-${address}`} 
                                className="font-mono cursor-pointer flex-grow truncate"
                                title={address}
                            >
                                {shortenAddress(address, 8, 6)} 
                            </Label>
                            <Button 
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive h-5 w-5 flex-shrink-0"
                                onClick={() => removeAddress(address)}
                                aria-label={`Remove wallet ${shortenAddress(address)}`}
                            >
                                <XIcon className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))} 
                </div>
                <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={selectedAddresses.length === addedAddresses.length}>All</Button>
                    <Button variant="outline" size="sm" onClick={handleDeselectAll} disabled={selectedAddresses.length === 0}>None</Button>
                </div>
            </div>

            <Separator className="md:hidden" /> 
            
            <div className="p-4">
                <div className="flex items-center mb-2 px-2">
                  <h2 className="text-lg font-semibold tracking-tight flex-1">Providers</h2>
                </div>
                <div className="absolute right-4 top-6 z-10">
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-muted transition"
                    onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                    title={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
                  >
                    {sortOrder === 'asc' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="space-y-1 p-2">
                    <Button
                        variant={selectedProviderAddress === null ? "secondary" : "ghost"}
                        className="w-full justify-start h-12 px-3 mb-1"
                        onClick={() => handleItemClick(null)}
                    >
                        <span className="flex-1 text-left truncate font-medium">
                            All Providers Overview
                        </span>
                    </Button>
                    
                    {!sortedProviders || sortedProviders.length === 0 ? (
                        <p className="text-sm text-muted-foreground px-2 py-4">No providers found.</p>
                    ) : (
                        sortedProviders.map((provider) => {
                            const staked = isCurrentlyStaked(provider);
                            const name = provider.identityInfo?.name || provider.identity || provider.provider;
                            const maxLen = 18;
                            const displayName = name.length > maxLen ? name.slice(0, maxLen - 3) + '...' : name;
                            return (
                                <Button
                                    key={provider.provider}
                                    variant={selectedProviderAddress === provider.provider ? "secondary" : "ghost"}
                                    className={`
                                        w-full justify-start h-12 px-3
                                        border-l-4
                                        ${staked ? 'border-green-500' : 'border-orange-400'}
                                        ${selectedProviderAddress === provider.provider ? 'bg-muted/60' : ''}
                                    `}
                                    onClick={() => handleItemClick(provider.provider)}
                                >
                                    {provider.identityInfo?.avatar && (
                                        <Image
                                            src={provider.identityInfo.avatar}
                                            alt={provider.identityInfo.name || provider.provider}
                                            width={28}
                                            height={28}
                                            className="mr-3 rounded-full w-7 h-7 object-cover border"
                                        />
                                    )}
                                    <span className="flex-1 min-w-0 flex items-center justify-between">
                                        <span
                                            className="block truncate overflow-hidden whitespace-nowrap text-ellipsis"
                                            style={{ maxWidth: 'calc(100% - 80px)' }}
                                        >
                                            {displayName}
                                        </span>
                                        {totalRewardsPerProvider && totalRewardsPerProvider[provider.provider] !== undefined && (
                                            <span className="ml-2 text-xs text-muted-foreground font-mono tabular-nums flex-shrink-0 text-right">
                                                {totalRewardsPerProvider[provider.provider].toLocaleString('en-US', { maximumFractionDigits: 3 })} EGLD
                                            </span>
                                        )}
                                    </span>
                                </Button>
                            );
                        })
                    )}
                </div>
            </div>
        </ScrollArea>
    );
}; 