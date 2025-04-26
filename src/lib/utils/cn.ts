/**
 * @file cn.ts
 * @description Utility function to merge Tailwind CSS classes conditionally.
 * @module lib/utils
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS classes.
 * Uses clsx to handle conditional classes and tailwind-merge to resolve conflicts.
 * 
 * @param inputs - Class values to merge (strings, arrays, objects).
 * @returns A string of merged Tailwind CSS classes.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
} 