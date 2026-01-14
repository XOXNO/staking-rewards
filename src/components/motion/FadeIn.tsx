/**
 * @file components/motion/FadeIn.tsx
 * @description Scroll-triggered fade with y-offset
 */

"use client";

import { motion, useInView, type HTMLMotionProps } from "framer-motion";
import { forwardRef, useRef } from "react";

interface FadeInProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, duration = 0.5, y = 20, once = true, className, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const ref = forwardedRef || internalRef;
    const isInView = useInView(typeof ref === 'object' && ref ? ref : internalRef, {
      once,
      margin: "-50px"
    });

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
        transition={{
          duration,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94] as const
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

FadeIn.displayName = "FadeIn";
