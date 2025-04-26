/**
 * @file ThemeContext.tsx
 * @description Provides context for managing light/dark theme switching.
 * @module lib/context
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface IThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<IThemeContextProps | undefined>(undefined);

interface IThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export const ThemeProvider: React.FC<IThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem(storageKey) as Theme | null;
      if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
        return storedTheme;
      }
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateResolvedTheme = () => {
      if (typeof window !== 'undefined') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(systemPrefersDark ? 'dark' : 'light');
      }
    };

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    const currentTheme = theme === 'system' ? resolvedTheme : theme;
    root.classList.add(currentTheme);

    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, theme);
    }

    if (theme === 'system') {
      updateResolvedTheme();
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (theme === 'system') {
            setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
        }
    }
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);

  }, [theme, storageKey, resolvedTheme]);

  const setTheme = (newTheme: Theme): void => {
    setThemeState(newTheme);
  };

  const toggleTheme = (): void => {
     const currentEffectiveTheme = theme === 'system' ? resolvedTheme : theme;
     setTheme(currentEffectiveTheme === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    resolvedTheme: theme === 'system' ? resolvedTheme : theme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): IThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 