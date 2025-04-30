/**
 * @file FunLoadingMessages.tsx
 * @description A fun loading component that displays random rotating messages about MultiversX
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { TextShimmer } from './text-shimmer';
import { Loader2 } from 'lucide-react';

interface IFunLoadingMessagesProps {
    className?: string;
    mainMessage?: string;
}

const funMessages = [
    "Searching for EGLD in the multiverse... 🌌",
    "Teaching dragons to count your rewards... 🐉",
    "Consulting the MultiversX oracles... 🔮",
    "Summoning your staking history... ✨",
    "Counting EGLD faster than a validator... 💨",
    "Traversing the blockchain at light speed... ⚡",
    "Asking Beniamin for your rewards... 😄",
    "Calculating APR with quantum precision... 🧮",
    "Waking up sleeping validators... 😴",
    "Polishing your EGLD coins... ✨",
    "Checking if xPortal is watching... 👀",
    "Mining through blockchain data... ⛏️",
    "Feeding the MultiversX dragons... 🐲",
    "Syncing with parallel universes... 🌠",
    "Asking xExchange for current rates... 📊",
    "Hunting for those sweet EGLD rewards... 🎯",
];

// Fonction pour obtenir un message aléatoire différent du message actuel
const getRandomMessage = (currentMessage: string | null): string => {
    const availableMessages = currentMessage 
        ? funMessages.filter(msg => msg !== currentMessage)
        : funMessages;
    const randomIndex = Math.floor(Math.random() * availableMessages.length);
    return availableMessages[randomIndex];
};

export const FunLoadingMessages: React.FC<IFunLoadingMessagesProps> = ({
    className,
    mainMessage = "Calculating global overview..."
}) => {
    // Initialiser avec un message aléatoire
    const [currentMessage, setCurrentMessage] = useState(() => getRandomMessage(null));
    const [isVisible, setIsVisible] = useState(true);

    const updateMessage = useCallback(() => {
        setIsVisible(false); // Déclenche l'animation de fade out
        
        // Attendre que le fade out soit terminé avant de changer le message
        setTimeout(() => {
            setCurrentMessage(getRandomMessage(currentMessage));
            setIsVisible(true); // Déclenche l'animation de fade in
        }, 500); // La moitié de la durée de la transition
    }, [currentMessage]);

    useEffect(() => {
        const interval = setInterval(updateMessage, 5000);
        return () => clearInterval(interval);
    }, [updateMessage]);

    return (
        <div className={cn('flex flex-col items-center justify-center space-y-6', className)}>
            {/* Spinner de chargement */}
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            
            {/* Message avec effet shimmer */}
            <div className="relative px-6 py-3 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-lg">
                <div 
                    className={cn(
                        "transition-all duration-1000 ease-in-out transform",
                        isVisible 
                            ? "opacity-100 translate-y-0 scale-100" 
                            : "opacity-0 translate-y-2 scale-95"
                    )}
                >
                    <TextShimmer
                        className="text-base font-medium text-foreground/90 [--base-color:theme(colors.foreground)] [--base-gradient-color:theme(colors.primary.DEFAULT)] dark:[--base-color:theme(colors.foreground)] dark:[--base-gradient-color:theme(colors.primary.DEFAULT)]"
                        duration={2}
                    >
                        {currentMessage}
                    </TextShimmer>
                </div>
            </div>
        </div>
    );
}; 