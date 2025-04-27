/**
 * @file AddWalletDialog.tsx
 * @description Reusable dialog component for adding a new wallet address.
 * @module components/dashboard/AddWalletDialog
 */

'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AddWalletForm } from './WalletInputForm';

interface IAddWalletDialogProps {
    children: React.ReactNode; // The trigger element(s)
    className?: string;
}

/**
 * Renders a dialog containing the AddWalletForm, triggered by its children.
 */
export const AddWalletDialog: React.FC<IAddWalletDialogProps> = ({ children, className }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className={className ?? "sm:max-w-[425px]"}>
                <DialogHeader>
                    <DialogTitle>Add New Wallet</DialogTitle>
                    <DialogDescription>
                        Enter the wallet address you want to add to your tracked list.
                    </DialogDescription>
                </DialogHeader>
                <div className="pt-4">
                    <AddWalletForm 
                        // Close the dialog upon successful submission
                        onSuccess={() => setIsOpen(false)} 
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddWalletDialog; 