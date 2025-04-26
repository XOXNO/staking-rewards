/**
 * @file LoadingAnimation.tsx
 * @description Displays a Lottie animation for loading states.
 * @module components/ui/LoadingAnimation
 */

'use client';

import React from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils/cn';

// Assuming you have placed your Lottie JSON in public/animations/
// For this example, we'll reference a conceptual path.
// You MUST replace this with the actual path to your downloaded JSON.
import loadingAnimationData from '../../../public/loading-coins.json'; // Adjust path as needed

interface ILoadingAnimationProps {
    message?: string;
    className?: string;
    lottieClassName?: string;
}

/**
 * Renders a Lottie animation, typically used for loading states.
 */
export const LoadingAnimation: React.FC<ILoadingAnimationProps> = ({
    message = 'Loading...',
    className,
    lottieClassName = 'w-40 h-40', // Default size
}) => {
    return (
        <div className={cn('flex flex-col items-center justify-center text-center', className)}>
            <Lottie 
                animationData={loadingAnimationData} 
                loop={true} 
                className={lottieClassName}
            />
            {message && <p className="text-lg text-muted-foreground mt-4">{message}</p>}
        </div>
    );
}; 