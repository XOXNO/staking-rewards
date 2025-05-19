/**
 * @file ProviderSidebar.tsx
 * @description Sidebar component to list and select staking providers.
 * @module components/dashboard/ProviderSidebar
 */

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useStaking } from '@/lib/context/StakingContext';
import Image from 'next/image';
import { IProviderWithIdentity } from '@/api/types/xoxno-rewards.types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { XIcon, ArrowDown, ArrowUp, PlusIcon, LoaderIcon } from 'lucide-react';
import { shortenAddress } from '@/lib/utils/formatters';
import { Separator } from "@/components/ui/separator";
import { Input } from '@/components/ui/input';
import { useAddressResolver } from '@/lib/hooks/useAddressResolver';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
        addAddress,
        dispatch,
    } = useStaking();
    const { addedAddresses, selectedAddresses, walletColorMap } = state;
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
    const [newAddress, setNewAddress] = useState("");
    const { toast } = useToast();
    const { resolveAddress, isResolving } = useAddressResolver();
    const isMobile = useIsMobile();

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
    
    // Handler for adding a new address
    const handleAddAddress = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newAddress.trim()) return;

        try {
        // Resolve the address or herotag
        const result = await resolveAddress(newAddress);
        
        if (result.error || !result.resolvedAddress) {
            toast({
            variant: "destructive",
            title: "Address resolution failed",
            description: result.error || "Unable to resolve the address",
            });
            return;
        }
        
        const resolvedAddress = result.resolvedAddress;
        
        // Check if the address already exists
        if (addedAddresses.includes(resolvedAddress)) {
            toast({
            variant: "default",
            title: "Address already exists",
            description: `The address ${shortenAddress(resolvedAddress)} is already in your list.`,
            className: "bg-orange-500 text-white border-orange-600",
            });
            return;
        }

        
        
            
            // Add the address
            await addAddress(resolvedAddress);
            setNewAddress("");
            
            // Success notification
            toast({
                variant: "default",
                title: "Address added successfully",
                description: `${shortenAddress(resolvedAddress)} has been added to your list.`,
                className: "bg-green-500 text-white border-green-600",
            });

        } catch (error) {
            // Error notification
            toast({
                variant: "destructive",
                title: "Error adding address",
                description: error instanceof Error ? error.message : "An unexpected error occurred.",
            });
        }
    }, [newAddress, resolveAddress, addedAddresses, addAddress, toast]);
    
    const sortedProviders = useMemo(() => {
      if (!providers) return [];
      return [...providers].sort((a, b) => {
        const aReward = totalRewardsPerProvider?.[a.provider] ?? 0;
        const bReward = totalRewardsPerProvider?.[b.provider] ?? 0;
        if (aReward === bReward) {
          // fallback: alphabetical sorting
          return (a.identityInfo?.name || a.identity || a.provider)
            .localeCompare(b.identityInfo?.name || b.identity || b.provider);
        }
        return sortOrder === 'asc' ? aReward - bReward : bReward - aReward;
      });
    }, [providers, totalRewardsPerProvider, sortOrder]);

    // Calculate total rewards across all providers
    const totalRewards = useMemo(() => {
      if (!totalRewardsPerProvider) return 0;
      return Object.values(totalRewardsPerProvider).reduce((sum, amount) => sum + amount, 0);
    }, [totalRewardsPerProvider]);

    const isCurrentlyStaked = (provider: IProviderWithIdentity) => {
      if (!fullRewardsData || !currentEpoch) return false;
      // Aggregate all epochs from all selected wallets for this provider
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

    // Format EGLD value with appropriate precision
    const formatEgldValue = (value: number) => {
      return value.toLocaleString('en-US', { 
        maximumFractionDigits: value < 10 ? 3 : value < 100 ? 2 : 1 
      });
    };

    return (
        <div className={`h-full flex flex-col ${className}`}>
            {/* Mobile Add Wallet Form - shown only on mobile */}
            {isMobile && (
                <div className="px-3 pt-3 pb-2">
                    <form onSubmit={handleAddAddress} className="w-full">
                        <h3 className="text-base font-semibold tracking-tight mb-2">Add Wallet</h3>
                        <div className="flex flex-col w-full gap-2">
                            <Input
                                type="text"
                                value={newAddress}
                                onChange={(e) => setNewAddress(e.target.value)}
                                placeholder="Enter MVX address or herotag..."
                                className="h-16 text-base px-3 py-4 rounded-md"
                                disabled={isResolving}
                            />
                            <Button 
                                type="submit" 
                                variant="outline" 
                                className="h-12 font-medium w-full rounded-md"
                                disabled={!newAddress.trim() || isResolving}
                            >
                                {isResolving ? (
                                    <LoaderIcon className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                )}
                                Add Wallet
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Mobile Wallet Management - shown only on mobile */}
            {isMobile && addedAddresses.length > 0 && (
                <div className="px-3 pb-2 border-b">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-semibold tracking-tight">Manage Wallets</h3>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={selectedAddresses.length === addedAddresses.length}>All</Button>
                            <Button variant="outline" size="sm" onClick={handleDeselectAll} disabled={selectedAddresses.length === 0}>None</Button>
                        </div>
                    </div>
                    
                    {/* Scrollable wallet list container with fixed height */}
                    <div className="border rounded-md bg-muted/20 p-1">
                        <ScrollArea className="h-[180px] max-h-[30vh] overflow-y-auto pr-2">
                            <div className="flex flex-col gap-2 p-2">
                                {addedAddresses.map((address) => (
                                    <div key={`sidebar-wallet-${address}`} className="flex items-center gap-2 border rounded-md px-2.5 py-2 bg-background text-sm">
                                        <button
                                            className="w-4 h-4 rounded-full flex-shrink-0 border transition-all cursor-pointer"
                                            style={{ 
                                                backgroundColor: selectedAddresses.includes(address) 
                                                    ? walletColorMap[address] 
                                                    : 'transparent',
                                                borderColor: walletColorMap[address],
                                                transform: selectedAddresses.includes(address) ? 'scale(1.1)' : 'scale(1)'
                                            }}
                                            onClick={() => toggleSelectedAddress(address)}
                                            aria-label={`${selectedAddresses.includes(address) ? 'Deselect' : 'Select'} wallet ${shortenAddress(address)}`}
                                            title={`${selectedAddresses.includes(address) ? 'Deselect' : 'Select'} wallet`}
                                        />
                                        <span
                                            className="font-mono cursor-pointer flex-grow truncate" 
                                            title={address}
                                            style={{ 
                                                color: selectedAddresses.includes(address) 
                                                    ? walletColorMap[address] 
                                                    : 'inherit' 
                                            }}
                                            onClick={() => toggleSelectedAddress(address)}
                                        >
                                            {shortenAddress(address, 8, 6)} 
                                        </span>
                                        <Button 
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive h-6 w-6 flex-shrink-0"
                                            onClick={() => removeAddress(address)}
                                            aria-label={`Remove wallet ${shortenAddress(address)}`}
                                        >
                                            <XIcon className="h-4.5 w-4.5" />
                                        </Button>
                                    </div>
                                ))} 
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            )}

            {/* Add separator only if we're in mobile and there's wallet content above */}
            {isMobile && <Separator />}
            
            {/* Providers List - with scroll area for mobile */}
            <ScrollArea className={`flex-grow overflow-y-auto ${isMobile ? 'max-h-[50vh]' : ''}`}>
                <div className="px-1 py-2">
                    <div className="flex items-center mb-1 px-2">
                      <h2 className="text-lg font-semibold tracking-tight flex-1">Providers</h2>
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
                    <div className="space-y-1">
                        <Button
                            variant={selectedProviderAddress === null ? "secondary" : "ghost"}
                            className="w-full justify-between items-center h-12 px-2.5 mb-1"
                            onClick={() => handleItemClick(null)}
                        >
                            <span className="truncate text-left">All Providers Overview</span>
                            {totalRewardsPerProvider && (
                                <div className="flex items-center text-xs text-muted-foreground font-mono tabular-nums whitespace-nowrap ml-1.5">
                                    {formatEgldValue(totalRewards)}
                                    <Image 
                                        src="/egldLogo.png" 
                                        alt="EGLD" 
                                        width={14} 
                                        height={14} 
                                        className="ml-1 inline-block" 
                                    />
                                </div>
                            )}
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
                                            w-full h-12 px-2.5
                                            border-l-4 flex justify-between items-center
                                            ${staked ? 'border-green-500' : 'border-orange-400'}
                                            ${selectedProviderAddress === provider.provider ? 'bg-muted/60' : ''}
                                        `}
                                        onClick={() => handleItemClick(provider.provider)}
                                    >
                                        <div className="flex items-center overflow-hidden">
                                            {provider.identityInfo?.avatar && (
                                                <Image
                                                    src={provider.identityInfo.avatar}
                                                    alt={provider.identityInfo.name || provider.provider}
                                                    width={28}
                                                    height={28}
                                                    className="flex-shrink-0 rounded-full w-7 h-7 object-cover border mr-2"
                                                />
                                            )}
                                            <span className="truncate">{displayName}</span>
                                        </div>
                                        {totalRewardsPerProvider && totalRewardsPerProvider[provider.provider] !== undefined && (
                                            <div className="flex items-center text-xs text-muted-foreground font-mono tabular-nums whitespace-nowrap ml-1.5">
                                                {formatEgldValue(totalRewardsPerProvider[provider.provider])}
                                                <Image 
                                                    src="/egldLogo.png" 
                                                    alt="EGLD" 
                                                    width={14} 
                                                    height={14} 
                                                    className="ml-1 inline-block" 
                                                />
                                            </div>
                                        )}
                                    </Button>
                                );
                            })
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}; 