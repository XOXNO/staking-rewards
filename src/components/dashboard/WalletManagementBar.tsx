/**
 * @file WalletManagementBar.tsx
 * @description Bar for managing added wallets (selection, removal, adding new).
 * @module components/dashboard/WalletManagementBar
 */

'use client';

import React, { useCallback } from 'react';
import { useStaking } from '@/lib/context/StakingContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { XIcon, PlusIcon } from 'lucide-react';
import { shortenAddress } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { AddWalletDialog } from './AddWalletDialog'; // Import the reusable dialog

interface IWalletManagementBarProps {
    className?: string;
}

export const WalletManagementBar: React.FC<IWalletManagementBarProps> = ({ className }) => {
    const {
        state,
        toggleSelectedAddress,
        removeAddress,
        dispatch, // For select/deselect all
    } = useStaking();
    const { addedAddresses, selectedAddresses } = state;

    return (
        <div className={cn(
            "flex items-center gap-4 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            className
        )}>
            {addedAddresses.length > 0 && (
                <div className="hidden md:flex items-center gap-4 flex-grow">
                    <span className="text-sm font-semibold mr-2">Wallets:</span>
                    <div className="flex items-center gap-2 flex-wrap flex-grow">
                        {addedAddresses.map((address) => (
                            <div key={address} className="flex items-center gap-1.5 border rounded-md px-2 py-1 bg-muted/50 text-xs">
                                <Checkbox
                                    id={`mgmt-wallet-${address}`}
                                    checked={selectedAddresses.includes(address)}
                                    onCheckedChange={() => toggleSelectedAddress(address)}
                                    aria-label={`Select wallet ${shortenAddress(address)}`}
                                    className="h-3.5 w-3.5"
                                />
                                <Label 
                                    htmlFor={`mgmt-wallet-${address}`}
                                    className="font-mono cursor-pointer truncate"
                                    title={address}
                                >
                                    {shortenAddress(address, 6, 4)}
                                </Label>
                                <Button 
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive h-4 w-4 ml-1"
                                    onClick={() => removeAddress(address)}
                                    aria-label={`Remove wallet ${shortenAddress(address)}`}
                                >
                                    <XIcon className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={cn(
                "flex items-center flex-shrink-0", 
                addedAddresses.length > 0 ? "md:ml-auto" : "ml-0"
            )}>
                <AddWalletDialog>
                    {addedAddresses.length === 0 ? (
                         <Button variant="default" size="sm">
                             <PlusIcon className="h-4 w-4 mr-2" />
                             Add First Wallet
                         </Button>
                    ) : (
                         <Button variant="outline" size="icon" className="h-7 w-7">
                             <PlusIcon className="h-4 w-4" />
                             <span className="sr-only">Add Wallet</span>
                         </Button>
                    )}
                </AddWalletDialog>
            </div>
        </div>
    );
}; 