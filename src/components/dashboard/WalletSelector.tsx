/**
 * @file WalletSelector.tsx
 * @description Component for selecting active wallets from the added list.
 * @module components/dashboard/WalletSelector
 */

'use client';

import React, { useCallback } from 'react';
import { useStaking } from '@/lib/context/StakingContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { ScrollArea } from '@/components/ui/scroll-area';
import { XIcon } from 'lucide-react';

interface IWalletSelectorProps {
    className?: string;
    // Add orientation prop if needed for horizontal layout
}

/**
 * Renders a list of added wallets with checkboxes to select/deselect them.
 */
export const WalletSelector: React.FC<IWalletSelectorProps> = ({ className }) => {
    const {
        state,
        toggleSelectedAddress,
        removeAddress,
        dispatch, // Need dispatch for SET_SELECTED_ADDRESSES
    } = useStaking();
    const { addedAddresses, selectedAddresses } = state;

    const handleSelectAll = useCallback(() => {
        dispatch({ type: 'SET_SELECTED_ADDRESSES', payload: { addresses: addedAddresses } });
    }, [dispatch, addedAddresses]);

    const handleDeselectAll = useCallback(() => {
        dispatch({ type: 'SET_SELECTED_ADDRESSES', payload: { addresses: [] } });
    }, [dispatch]);

    if (addedAddresses.length === 0) {
        return null; // Don't render if no addresses are added
    }

    return (
        <div className={cn("p-4 border rounded-lg bg-card text-card-foreground shadow-sm", className)}>
            <h3 className="text-sm font-semibold mb-3">Select Wallets</h3>
            <div className="flex gap-2 mb-3">
                 <Button variant="outline"  size="sm" onClick={handleSelectAll} disabled={selectedAddresses.length === addedAddresses.length}>Select All</Button>
                 <Button variant="outline" size="sm" onClick={handleDeselectAll} disabled={selectedAddresses.length === 0}>Deselect All</Button>
            </div>
            <ScrollArea className="h-[150px] pr-3"> {/* Adjust height as needed */}
                <div className="space-y-2">
                    {addedAddresses.map((address) => (
                        <div key={address} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50">
                             <div className="flex items-center space-x-2 flex-grow overflow-hidden">
                                <Checkbox
                                    id={`wallet-${address}`}
                                    checked={selectedAddresses.includes(address)}
                                    onCheckedChange={() => toggleSelectedAddress(address)}
                                    aria-label={`Select wallet ${shortenAddress(address)}`}
                                />
                                <Label 
                                    htmlFor={`wallet-${address}`} 
                                    className="text-xs font-mono cursor-pointer truncate flex-grow"
                                    title={address} // Show full address on hover
                                >
                                    {shortenAddress(address)}
                                </Label>
                            </div>
                            <Button 
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive h-5 w-5 flex-shrink-0"
                                onClick={() => removeAddress(address)}
                                aria-label={`Remove wallet ${shortenAddress(address)}`}
                            >
                                <XIcon className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
  );
};
