/**
 * @file WalletInputForm.tsx
 * @description Component for users to input their wallet address to fetch staking rewards.
 * @module components/dashboard/WalletInputForm
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
// Import a spinner component if available, or use a simple text indicator
// import { Spinner } from '@/components/ui/Spinner';

export interface IWalletInputFormProps {
  /** Callback function when the address is submitted */
  onSubmit: (address: string) => Promise<void>; // Make async for potential API call
  /** Optional class name for custom styling */
  className?: string;
}

/**
 * A form component for entering a wallet address.
 * Handles input state, submission, and loading indication.
 *
 * @component
 * @example
 * ```tsx
 * const handleAddressSubmit = async (address) => {
 *   console.log('Fetching rewards for:', address);
 *   // Add API call logic here
 * };
 *
 * <WalletInputForm onSubmit={handleAddressSubmit} />
 * ```
 */
export const WalletInputForm: React.FC<IWalletInputFormProps> = ({
  onSubmit,
  className,
}) => {
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setAddress(event.target.value);
      if (error) {
        setError(null); // Clear error when user types
      }
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      if (!address.trim() || isLoading) {
        return; // Prevent submission if empty or already loading
      }

      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call delay
        // In a real scenario, this would be the actual API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // TODO: Add address validation logic here if needed

        await onSubmit(address.trim());
      } catch (err) {
        console.error('Submission error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        // Optionally call an error reporting service
      } finally {
        setIsLoading(false);
      }
    },
    [address, isLoading, onSubmit]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('w-full max-w-md space-y-4', className)}
      aria-label="Wallet Address Input Form"
    >
      <Input
        type="text"
        value={address}
        onChange={handleInputChange}
        placeholder="Enter your wallet address (e.g., 0x... or erd...)"
        aria-label="Wallet Address"
        aria-describedby="wallet-error"
        disabled={isLoading}
        className={cn(
          'input-lg rounded-full px-6 py-3 text-lg',
          error ? 'border-destructive focus:border-destructive' : ''
        )}
        required
      />
      {error && (
        <p id="wallet-error" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="w-full rounded-full py-3 text-lg"
        disabled={isLoading || !address.trim()}
        aria-live="polite"
      >
        {isLoading ? (
          <>
            {/* Refined SVG Spinner */}
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Fetching Rewards...
          </>
        ) : (
          'Show Rewards'
        )}
      </Button>
    </form>
  );
};

// Default export for convenience
export default WalletInputForm; 