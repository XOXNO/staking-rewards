/**
 * @file WalletManagementBar.tsx
 * @description Bar for managing added wallets (selection, removal, adding new).
 * @module components/dashboard/WalletManagementBar
 */

"use client";

import React, { useEffect, useState } from "react";
import { useStaking } from "@/lib/context/StakingContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { XIcon, PlusIcon } from "lucide-react";
import { shortenAddress } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { getWalletColorMap } from '@/lib/utils/utils';
import { CHART_COLORS } from '@/lib/constants/chartColors';
import { ColorDotPicker } from './ColorDotPicker';
import { useToast } from "@/hooks/use-toast";

interface IWalletManagementBarProps {
  className?: string;
}

export const WalletManagementBar: React.FC<IWalletManagementBarProps> = ({
  className,
}) => {
  const { state, toggleSelectedAddress, removeAddress, addAddress } = useStaking();
  const { addedAddresses, selectedAddresses } = state;
  const [newAddress, setNewAddress] = useState("");
  const { toast } = useToast();

  // Etat local pour le mapping wallet -> couleur
  const [walletColorMap, setWalletColorMap] = useState<Record<string, string>>({});

  // Initialise le mapping à chaque changement de la liste
  useEffect(() => {
    setWalletColorMap((prev) => {
      // Conserve les couleurs custom, complète avec la palette pour les nouveaux
      const autoMap = getWalletColorMap(addedAddresses, CHART_COLORS.categorical);
      const merged: Record<string, string> = {};
      addedAddresses.forEach(addr => {
        merged[addr] = prev[addr] || autoMap[addr];
      });
      return merged;
    });
  }, [addedAddresses]);

  // Handler pour changer la couleur d'un wallet
  const handleColorChange = (address: string, color: string) => {
    setWalletColorMap((prev) => ({ ...prev, [address]: color }));
  };

  // Handler pour ajouter une nouvelle adresse
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedAddress = newAddress.trim();
    
    if (!trimmedAddress) return;

    try {
      // Vérifie si l'adresse existe déjà
      if (addedAddresses.includes(trimmedAddress)) {
        toast({
          variant: "default",
          title: "Address already exists",
          description: `The address ${shortenAddress(trimmedAddress)} is already in your list.`,
          className: "bg-orange-500 text-white border-orange-600",
        });
        return;
      }

      // Vérifie le format de l'adresse MVX (commence par 'erd' et a une longueur de 62 caractères)
      if (!trimmedAddress.startsWith('erd') || trimmedAddress.length !== 62) {
        toast({
          variant: "destructive",
          title: "Invalid MVX address",
          description: "Please enter a valid MultiversX address starting with 'erd'.",
        });
        return;
      }

      // Ajoute l'adresse
      addAddress(trimmedAddress);
      setNewAddress("");
      
      // Notification de succès
      toast({
        variant: "default",
        title: "Address added successfully",
        description: `${shortenAddress(trimmedAddress)} has been added to your list.`,
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
  };

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
          placeholder="Enter MVX address..."
          className="h-8 text-sm"
        />
        <Button type="submit" variant="outline" size="sm" className="h-8">
          <PlusIcon className="h-4 w-4" />
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
                  onChange={(color) => handleColorChange(address, color)}
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
