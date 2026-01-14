/**
 * @file components/ui/gradient-background.tsx
 * @description Animated gradient mesh background for hero sections
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface GradientBackgroundProps {
  className?: string;
  intensity?: "subtle" | "medium" | "strong";
}

export function GradientBackground({
  className,
  intensity = "medium"
}: GradientBackgroundProps) {
  const opacityMap = {
    subtle: 0.3,
    medium: 0.5,
    strong: 0.7,
  };

  const opacity = opacityMap[intensity];

  return (
    <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      {/* Primary gradient blob */}
      <motion.div
        className="absolute -top-1/2 -left-1/4 h-[800px] w-[800px] rounded-full"
        style={{
          background: `radial-gradient(circle, var(--gradient-start) 0%, transparent 70%)`,
          opacity,
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary gradient blob */}
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, var(--gradient-end) 0%, transparent 70%)`,
          opacity,
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, -40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Tertiary gradient blob */}
      <motion.div
        className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full"
        style={{
          background: `radial-gradient(circle, var(--gradient-mid) 0%, transparent 70%)`,
          opacity: opacity * 0.6,
        }}
        animate={{
          x: [0, -30, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      />

      {/* Noise overlay for texture */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
