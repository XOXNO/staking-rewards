/**
 * @file components/motion/SlideIn.tsx
 * @description Slide in from direction animation
 */

"use client";

import { motion, useInView, type HTMLMotionProps } from "framer-motion";
import { forwardRef, useRef } from "react";

type Direction = "left" | "right" | "up" | "down";

const getOffset = (direction: Direction, distance: number) => {
  switch (direction) {
    case "left": return { x: -distance, y: 0 };
    case "right": return { x: distance, y: 0 };
    case "up": return { x: 0, y: -distance };
    case "down": return { x: 0, y: distance };
  }
};

interface SlideInProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: React.ReactNode;
  direction?: Direction;
  distance?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export const SlideIn = forwardRef<HTMLDivElement, SlideInProps>(
  ({
    children,
    direction = "left",
    distance = 30,
    delay = 0,
    duration = 0.5,
    once = true,
    className,
    ...props
  }, forwardedRef) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const ref = forwardedRef || internalRef;
    const isInView = useInView(typeof ref === 'object' && ref ? ref : internalRef, {
      once,
      margin: "-50px"
    });

    const offset = getOffset(direction, distance);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, ...offset }}
        animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
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

SlideIn.displayName = "SlideIn";
