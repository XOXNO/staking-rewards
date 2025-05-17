/**
 * @file ThemeToggle.tsx
 * @description Component to toggle between light and dark themes.
 * @module components/ui/ThemeToggle
 */

'use client';

import * as React from "react";
import { useTheme } from "@/lib/context/ThemeContext";
import { Button } from "@/components/ui/button";

// Icônes Lucide (Sun et Moon)
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M5 5l1.5 1.5" />
    <path d="M17.5 17.5L19 19" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M5 19l1.5-1.5" />
    <path d="M17.5 6.5L19 5" />
  </svg>
);
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
  </svg>
);

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { toggleTheme, resolvedTheme } = useTheme();
  const [isRotating, setIsRotating] = React.useState(false);

  // useEffect only runs on the client, so we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Gestion du clic : changement immédiat de thème et d'icône, puis rotation
  const handleClick = () => {
    toggleTheme();
    setIsRotating(true);
    setTimeout(() => {
      setIsRotating(false);
    }, 500); // Durée de l'animation CSS
  };

  if (!mounted) {
    // Render a placeholder or null on the server and initial client render
    // to prevent hydration mismatch
    return <Button variant="ghost" size="icon" disabled aria-label="Toggle theme" className="w-10 h-10"></Button>; 
  }

  // Determine which icon to show based on the resolved theme
  const Icon = resolvedTheme === 'dark' ? SunIcon : MoonIcon;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label="Toggle theme"
      className={isRotating ? 'theme-toggle-rotate' : ''}
    >
      <Icon />
    </Button>
  );
} 