/**
 * @file hooks/useContainerDimensions.ts
 * @description Hook to measure container dimensions for responsive charts
 */

"use client";

import { useState, useEffect, useCallback, RefObject } from "react";

interface Dimensions {
  width: number;
  height: number;
}

export function useContainerDimensions(
  ref: RefObject<HTMLDivElement | null>,
  defaultDimensions: Dimensions = { width: 800, height: 450 }
): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>(defaultDimensions);

  const updateDimensions = useCallback(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      setDimensions({
        width: Math.max(width, 100),
        height: height > 0 ? height : defaultDimensions.height,
      });
    }
  }, [ref, defaultDimensions.height]);

  useEffect(() => {
    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref, updateDimensions]);

  return dimensions;
}
