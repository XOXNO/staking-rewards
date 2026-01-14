/**
 * @file components/motion/AnimatedPage.tsx
 * @description Page-level enter/exit transitions
 */

"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 }
  }
};

interface AnimatedPageProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export const AnimatedPage = forwardRef<HTMLDivElement, AnimatedPageProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedPage.displayName = "AnimatedPage";
