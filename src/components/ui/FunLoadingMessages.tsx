/**
 * @file FunLoadingMessages.tsx
 * @description A fun loading component that displays random rotating messages about MultiversX
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IFunLoadingMessagesProps {
    className?: string;
    mainMessage?: string;
    spacing?: 'default' | 'large';
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

// Function to get a random message different from the current one
const getRandomMessage = (currentMessage: string | null): string => {
    const availableMessages = currentMessage 
        ? funMessages.filter(msg => msg !== currentMessage)
        : funMessages;
    const randomIndex = Math.floor(Math.random() * availableMessages.length);
    return availableMessages[randomIndex];
};

// Function to split text while preserving emojis and spaces
const splitTextPreservingEmojis = (text: string): string[] => {
    // This regex captures emojis, spaces and individual characters
    return Array.from(text.matchAll(/\p{Extended_Pictographic}|\s+|[^\s\p{Extended_Pictographic}]/gu))
        .map(match => match[0]);
};

// Component for letter-by-letter animation
const AnimatedLetters = ({ text }: { text: string }) => {
    const characters = splitTextPreservingEmojis(text);
    
    return (
        <div className="text-center">
            {characters.map((char, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        duration: 0.15,
                        delay: index * 0.025
                    }}
                    style={{ 
                        display: 'inline-block',
                        minWidth: char === ' ' ? '0.25em' : 'auto'
                    }}
                >
                    {char}
                </motion.span>
            ))}
        </div>
    );
};

export const FunLoadingMessages: React.FC<IFunLoadingMessagesProps> = ({
    className,
    // mainMessage = "Calculating global overview...",
    spacing = 'default'
}) => {
    const [currentMessage, setCurrentMessage] = useState(() => getRandomMessage(null));
    const [key, setKey] = useState(0);

    const updateMessage = useCallback(() => {
        setKey(prev => prev + 1);
        setCurrentMessage(getRandomMessage(currentMessage));
    }, [currentMessage]);

    useEffect(() => {
        const interval = setInterval(updateMessage, 4000);
        return () => clearInterval(interval);
    }, [updateMessage]);

    return (
        <div className={cn(
            'flex flex-col items-center justify-center min-h-[50vh]',
            spacing === 'large' && 'min-h-[70vh]',
            className
        )}>
            {/* Spinner around Loading text */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                <Loader2 className="absolute w-full h-full animate-spin text-primary opacity-20" />
                <span className="text-base font-medium text-foreground/90">
                    Loading...
                </span>
            </div>
            
            {/* Message with shimmer effect */}
            <div className="relative w-full max-w-md px-6 py-4 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-lg">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-center min-h-[3rem]"
                    >
                        <AnimatedLetters text={currentMessage} />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}; 