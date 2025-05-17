/**
 * @file WalletManagementBar.tsx
 * @description Bar for managing added wallets (selection, removal, adding new).
 * @module components/dashboard/WalletManagementBar
 */

"use client";

import React, { useState, useCallback } from "react";
import { useStaking } from "@/lib/context/StakingContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { XIcon, PlusIcon, LoaderIcon } from "lucide-react";
import { shortenAddress } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { ColorDotPicker } from './ColorDotPicker';
import { useToast } from "@/hooks/use-toast";
import { useAddressResolver } from "@/lib/hooks/useAddressResolver";

interface IWalletManagementBarProps {
  className?: string;
}

export const WalletManagementBar: React.FC<IWalletManagementBarProps> = ({
  className,
}) => {
  const { state, toggleSelectedAddress, removeAddress, addAddress, setWalletColor } = useStaking();
  const { addedAddresses, selectedAddresses, walletColorMap } = state;
  const [newAddress, setNewAddress] = useState("");
  const { toast } = useToast();
  const { resolveAddress, isResolving } = useAddressResolver();

  // Handler pour ajouter une nouvelle adresse
  const handleAddAddress = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAddress.trim()) return;

    try {
      // Résoudre l'adresse ou le herotag
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
      
      // Vérifie si l'adresse existe déjà
      if (addedAddresses.includes(resolvedAddress)) {
        toast({
          variant: "default",
          title: "Address already exists",
          description: `The address ${shortenAddress(resolvedAddress)} is already in your list.`,
          className: "bg-orange-500 text-white border-orange-600",
        });
        return;
      }

      // Ajoute l'adresse
      await addAddress(resolvedAddress);
      setNewAddress("");
      
      // Notification de succès
      toast({
        variant: "default",
        title: "Address added successfully",
        description: `${shortenAddress(resolvedAddress)} has been added to your list.`,
        className: "bg-green-500 text-white border-green-600",
      });

    } catch (error) {
      // Notification d'erreur
      toast({
        variant: "destructive",
        title: "Error adding address",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    }
  }, [newAddress, resolveAddress, addedAddresses, addAddress, toast]);

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      {/* Formulaire d'ajout d'adresse */}
      <form onSubmit={handleAddAddress} className="flex items-center gap-2 min-w-[300px]">
        <Input
          type="text"
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
          placeholder="Enter MVX address or herotag..."
          className="h-8 text-sm"
          disabled={isResolving}
        />
        <Button type="submit" variant="outline" size="sm" className="h-8" disabled={!newAddress.trim() || isResolving}>
          {isResolving ? (
            <LoaderIcon className="h-4 w-4 animate-spin" />
          ) : (
            <PlusIcon className="h-4 w-4" />
          )}
          <span className="sr-only">Add Wallet</span>
        </Button>
      </form>

      {addedAddresses.length > 0 && (
        <div className="hidden md:flex items-center gap-4 flex-grow">
          <span className="text-sm font-semibold mr-2">Wallets:</span>
          <div className="flex items-center gap-2 flex-wrap flex-grow">
            {addedAddresses.map((address) => (
              <div
                key={address}
                className="flex items-center gap-1.5 border rounded-md px-2 py-1 bg-muted/50 text-xs"
              >
                {/* Dot coloré + picker */}
                <ColorDotPicker
                  color={walletColorMap[address]}
                  onChange={(color) => setWalletColor(address, color)}
                  size={16}
                />
                {/* Checkbox colorée */}
                <Checkbox
                  id={`mgmt-wallet-${address}`}
                  checked={selectedAddresses.includes(address)}
                  onCheckedChange={() => toggleSelectedAddress(address)}
                  aria-label={`Select wallet ${shortenAddress(address)}`}
                  className="h-3.5 w-3.5"
                  style={{
                    accentColor: walletColorMap[address],
                    borderColor: walletColorMap[address],
                  }}
                />
                {/* Texte coloré */}
                <Label
                  htmlFor={`mgmt-wallet-${address}`}
                  className="font-mono cursor-pointer truncate"
                  title={address}
                  style={{ color: walletColorMap[address] }}
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
    </div>
  );
};
