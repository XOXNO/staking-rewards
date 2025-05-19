/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @file AddWalletForm.tsx
 * @description Component for adding a new wallet address.
 * @module components/dashboard/AddWalletForm
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStaking } from '@/lib/context/StakingContext';
import { cn } from '@/lib/utils/cn';
import { useAddressResolver } from '@/lib/hooks/useAddressResolver';
import { useIsMobile } from '@/hooks/use-mobile';

interface IAddWalletFormProps {
    className?: string;
    onSuccess?: () => void; // Add optional onSuccess callback prop
}

/**
 * Interface for the username API response
 */
interface IUsernameResponse {
    address: string;
    username: string;
    balance: string;
    nonce: number;
    shard: number;
    isGuarded: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // For other properties in the response
}

/**
 * Renders a form for users to add a wallet address.
 */
export const AddWalletForm: React.FC<IAddWalletFormProps> = ({ className, onSuccess }) => {
    const [address, setAddress] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const { addAddress, state } = useStaking(); // Use addAddress from context
    const { isLoading } = state;
    const isMobile = useIsMobile();
    
    // Utilise le hook de résolution d'adresse
    const { resolveAddress, isResolving, error, clearError } = useAddressResolver();

    const handleAddressChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newAddress = event.target.value;
        setAddress(newAddress);
        if (validationError || error) {
            setValidationError(null);
            clearError();
        }
    }, [validationError, error, clearError]);

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        // Résoudre l'adresse ou le herotag
        const result = await resolveAddress(address);
        
        if (result.error) {
            setValidationError(result.error);
            return;
        }
        
        if (!result.resolvedAddress) {
            setValidationError("Unable to resolve address");
            return;
        }
        
        const finalAddress = result.resolvedAddress;
        
        // Check if this specific address is currently loading
        const isCurrentAddressLoading = isLoading[finalAddress] || false;
        if (isCurrentAddressLoading) return; // Prevent double submission

        await addAddress(finalAddress); // Call the context action
        setAddress(''); // Clear input after adding
        onSuccess?.(); // Call onSuccess callback if provided
    }, [address, addAddress, isLoading, onSuccess, resolveAddress]);

    const isCurrentAddressLoading = isLoading[address] || false;
    const isSubmitting = isCurrentAddressLoading || isResolving;

    return (
        <form 
            onSubmit={handleSubmit} 
            className={cn(
                'flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full max-w-lg',
                isMobile && 'p-4 pb-8 pt-6',
                className
            )}
        >
            <div className="w-full flex flex-col">
                <div className={cn(
                    "flex flex-grow group",
                    isMobile && "flex-col"
                )}>
                    <Input
                        type="text"
                        value={address}
                        onChange={handleAddressChange}
                        placeholder="Enter MultiversX address (erd1...) or herotag..."
                        className={cn(
                            "flex-grow focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring h-12 text-base placeholder:truncate placeholder:overflow-ellipsis placeholder:whitespace-nowrap group-hover:border-ring group-hover:bg-muted/40 group-focus-within:border-ring group-focus-within:bg-muted/40 transition-colors text-foreground bg-background dark:bg-input/30 border border-input",
                            isMobile ? "rounded-t-md rounded-b-none mb-0" : "rounded-r-none",
                            isMobile && "h-16 text-lg px-4 py-5",
                            validationError ? 'border-destructive focus-visible:ring-destructive' : ''
                        )}
                        aria-label="Wallet Address Input"
                        disabled={isSubmitting}
                    />
                    <Button 
                        type="submit" 
                        className={cn(
                            "min-w-[100px] h-12 text-base border border-input transition-colors bg-black text-white dark:bg-white dark:text-black group-hover:border-ring group-focus:border-ring shadow-sm",
                            isMobile ? "rounded-b-md rounded-t-none w-full h-16 text-lg font-medium mt-0" : "rounded-l-none"
                        )}
                        disabled={!address || !!validationError || isSubmitting}
                    >
                        {isResolving ? 'Resolving...' : isCurrentAddressLoading ? 'Adding...' : 'Add Wallet'}
                    </Button>
                </div>
                {validationError && (
                    <p className="text-destructive text-xs mt-1 ml-1">{validationError}</p>
                )}
            </div>
        </form>
    );
};

// Default export for convenience
export default AddWalletForm; 