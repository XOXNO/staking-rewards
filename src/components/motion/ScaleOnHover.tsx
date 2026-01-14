/**
 * @file components/motion/ScaleOnHover.tsx
 * @description Generic scale wrapper for hover effects
 */

"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

interface ScaleOnHoverProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  scale?: number;
  tapScale?: number;
}

export const ScaleOnHover = forwardRef<HTMLDivElement, ScaleOnHoverProps>(
  ({ children, scale = 1.05, tapScale = 0.98, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale }}
        whileTap={{ scale: tapScale }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

ScaleOnHover.displayName = "ScaleOnHover";
