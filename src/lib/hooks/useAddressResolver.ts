/**
 * @file useAddressResolver.ts
 * @description Hook pour résoudre une entrée utilisateur en adresse MultiversX.
 * @module lib/hooks/useAddressResolver
 */

import { useState, useCallback } from 'react';

/**
 * Interface pour la réponse de l'API des noms d'utilisateurs MultiversX
 */
interface IUsernameResponse {
    address: string;
    username: string;
    balance: string;
    nonce: number;
    shard: number;
    isGuarded: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // Pour les autres propriétés de la réponse
}

/**
 * Résultat de la résolution d'adresse
 */
interface IAddressResolutionResult {
    /** Adresse MultiversX résolue, ou null si non résolue */
    resolvedAddress: string | null;
    /** Indique si la résolution est en cours */
    isResolving: boolean;
    /** Message d'erreur si la résolution a échoué */
    error: string | null;
}

/**
 * Hook pour résoudre une entrée utilisateur en adresse MultiversX.
 * Vérifie d'abord si l'entrée est une adresse valide (commence par erd1),
 * sinon tente de la résoudre comme un herotag via l'API MultiversX.
 */
export function useAddressResolver() {
    const [isResolving, setIsResolving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Vérifie si l'entrée est directement une adresse MultiversX valide
     */
    const isValidErdAddress = useCallback((input: string): boolean => {
        return input.startsWith('erd1') && input.length >= 58;
    }, []);

    /**
     * Résout un herotag MultiversX en adresse via l'API
     */
    const resolveUsername = useCallback(async (username: string): Promise<string | null> => {
        try {
            setIsResolving(true);
            setError(null);
            
            const response = await fetch(`https://api.multiversx.com/usernames/${username}?withGuardianInfo=false`);
            
            if (!response.ok) {
                setError(`Herotag "${username}" could not be resolved`);
                return null;
            }
            
            const data = await response.json() as IUsernameResponse;
            return data.address || null;
        } catch (error) {
            console.error('Error resolving username:', error);
            setError('Error connecting to MultiversX API');
            return null;
        } finally {
            setIsResolving(false);
        }
    }, []);

    /**
     * Résout une entrée utilisateur en adresse MultiversX
     * @param input Entrée utilisateur (adresse ou herotag)
     * @returns Promesse avec le résultat de la résolution
     */
    const resolveAddress = useCallback(async (input: string): Promise<IAddressResolutionResult> => {
        setError(null);
        
        if (!input || input.trim() === '') {
            return { resolvedAddress: null, isResolving: false, error: 'Input is empty' };
        }
        
        const trimmedInput = input.trim();
        
        // Si c'est déjà une adresse erd1 valide, on la retourne directement
        if (isValidErdAddress(trimmedInput)) {
            return { resolvedAddress: trimmedInput, isResolving: false, error: null };
        }
        
        // Sinon, on essaie de résoudre comme un herotag
        const resolvedAddress = await resolveUsername(trimmedInput);
        
        if (resolvedAddress) {
            return { resolvedAddress, isResolving: false, error: null };
        }
        
        return { 
            resolvedAddress: null, 
            isResolving: false, 
            error: `"${trimmedInput}" is neither a valid MultiversX address nor a resolvable herotag` 
        };
    }, [isValidErdAddress, resolveUsername]);

    return {
        resolveAddress,
        isResolving,
        error,
        clearError: () => setError(null),
        isValidErdAddress
    };
} 