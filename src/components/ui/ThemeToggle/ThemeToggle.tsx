/**
 * @file ThemeToggle.tsx
 * @description Component to toggle between light and dark themes.
 * @module components/ui/ThemeToggle
 */

'use client';

import * as React from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import { Button } from "@/components/ui/button";

// Simple Sun/Moon icons (replace with actual icons later if needed)
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M12 12a2.25 2.25 0 0 0-2.25 2.25 2.25 2.25 0 0 0 2.25 2.25c.607 0 1.165-.24 1.591-.636M12 12a2.25 2.25 0 0 1 2.25-2.25 2.25 2.25 0 0 1 2.25 2.25c0 .607-.24 1.165-.636 1.591" />
  </svg>
);
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  </svg>
);

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, toggleTheme, resolvedTheme } = useTheme();

  // useEffect only runs on the client, so we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or null on the server and initial client render
    // to prevent hydration mismatch
    return <Button variant="ghost" size="icon" disabled aria-label="Toggle theme" className="w-10 h-10"></Button>; 
  }

  // Determine which icon to show based on the resolved theme
  const Icon = resolvedTheme === 'dark' ? SunIcon : MoonIcon;

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      <Icon />
    </Button>
  );
} 