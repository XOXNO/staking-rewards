/**
 * @file ProviderSidebar.tsx
 * @description Sidebar component to list and select staking providers.
 * @module components/dashboard/ProviderSidebar
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { IProviderWithIdentity } from '@/api/types/xoxno-rewards.types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface IProviderSidebarProps {
    providers: IProviderWithIdentity[] | undefined;
    selectedProviderAddress: string | null;
    onSelectProvider: (providerAddress: string | null) => void;
    onItemClick?: () => void;
}

/**
 * Renders a sidebar listing available staking providers.
 * Allows selecting a provider to view its details.
 */
export const ProviderSidebar: React.FC<IProviderSidebarProps> = ({
    providers,
    selectedProviderAddress,
    onSelectProvider,
    onItemClick,
}) => {
    const handleItemClick = (providerAddress: string | null) => {
        onSelectProvider(providerAddress);
        onItemClick?.();
    };
    
    return (
        <ScrollArea className="h-full px-2 pt-4">
            <h2 className="text-lg font-semibold tracking-tight mb-2 px-2">Providers</h2>
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
                
                {!providers || providers.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-2 py-4">No providers found.</p>
                ) : (
                    providers.map((provider) => (
                        <Button
                            key={provider.provider}
                            variant={selectedProviderAddress === provider.provider ? "secondary" : "ghost"}
                            className="w-full justify-start h-12 px-3"
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
                            <span className="flex-1 text-left truncate">
                                {provider.identityInfo?.name || provider.identity || provider.provider}
                            </span>
                        </Button>
                    ))
                )}
            </div>
        </ScrollArea>
    );
}; 