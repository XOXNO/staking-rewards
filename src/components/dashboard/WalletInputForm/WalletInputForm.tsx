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
import { validateAddress } from '@/lib/utils/validators';

interface IAddWalletFormProps {
    className?: string;
    onSuccess?: () => void; // Add optional onSuccess callback prop
}

/**
 * Renders a form for users to add a wallet address.
 */
export const AddWalletForm: React.FC<IAddWalletFormProps> = ({ className, onSuccess }) => {
    const [address, setAddress] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const { addAddress, state } = useStaking(); // Use addAddress from context
    const { isLoading } = state;

    const handleAddressChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newAddress = event.target.value;
        setAddress(newAddress);
        if (validationError && validateAddress(newAddress)) { // Re-validate on change if there was an error
            setValidationError(null);
        }
    }, [validationError]);

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateAddress(address)) { // Validate before submitting
            setValidationError('Invalid wallet address format.');
            return;
        }
        setValidationError(null);
        // Check if this specific address is currently loading
        const isCurrentAddressLoading = isLoading[address] || false;
        if (isCurrentAddressLoading) return; // Prevent double submission

        await addAddress(address); // Call the context action
        setAddress(''); // Clear input after adding
        onSuccess?.(); // Call onSuccess callback if provided
    }, [address, addAddress, isLoading, onSuccess]);

    const isCurrentAddressLoading = isLoading[address] || false;

    return (
        <form 
            onSubmit={handleSubmit} 
            className={cn('flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full max-w-lg', className)}
        >
            <div className="w-full flex flex-col">
                <div className="flex flex-grow">
                    <Input
                        type="text"
                        value={address}
                        onChange={handleAddressChange}
                        placeholder="Enter wallet address to add..."
                        className={cn(
                            "flex-grow rounded-r-none focus-visible:ring-offset-0",
                            validationError ? 'border-destructive focus-visible:ring-destructive' : ''
                        )}
                        aria-label="Wallet Address Input"
                        disabled={isCurrentAddressLoading}
                    />
                    <Button 
                        type="submit" 
                        className="rounded-l-none min-w-[100px]"
                        disabled={!address || !!validationError || isCurrentAddressLoading}
                    >
                        {isCurrentAddressLoading ? 'Adding...' : 'Add Wallet'}
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