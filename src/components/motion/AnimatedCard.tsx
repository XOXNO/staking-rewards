/**
 * @file components/motion/AnimatedCard.tsx
 * @description Card with hover lift effect
 */

"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  hoverScale?: number;
  hoverY?: number;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, hoverScale = 1.02, hoverY = -4, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          y: hoverY,
          scale: hoverScale,
          transition: { type: "spring", stiffness: 400, damping: 17 }
        }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";
