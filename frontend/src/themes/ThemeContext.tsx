import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeVariant, ThemeConfig } from './config';
import { themes } from './config';

interface ThemeContextType {
  currentTheme: ThemeVariant;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeVariant) => void;
  toggleTheme: () => void;
  availableThemes: ThemeVariant[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeVariant;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeVariant>(() => {
    // Try to load theme from localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('elearn-theme') as ThemeVariant;
      if (savedTheme && Object.keys(themes).includes(savedTheme)) {
        return savedTheme;
      }
    }
    return defaultTheme;
  });

  const themeConfig = themes[currentTheme];
  const availableThemes = Object.keys(themes) as ThemeVariant[];

  const setTheme = (theme: ThemeVariant) => {
    setCurrentTheme(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('elearn-theme', theme);
    }
  };

  const toggleTheme = () => {
    const currentIndex = availableThemes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    setTheme(availableThemes[nextIndex]);
  };

  // Apply theme to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      // Remove all theme classes
      availableThemes.forEach(theme => {
        root.classList.remove(`theme-${theme}`);
      });
      
      // Add current theme class
      root.classList.add(`theme-${currentTheme}`);
      
      // Set CSS custom properties
      const colors = themeConfig.colors;
      
      // Primary colors
      Object.entries(colors.primary).forEach(([key, value]) => {
        root.style.setProperty(`--color-primary-${key}`, value);
      });
      
      // Secondary colors
      Object.entries(colors.secondary).forEach(([key, value]) => {
        root.style.setProperty(`--color-secondary-${key}`, value);
      });
      
      // Gray colors
      Object.entries(colors.gray).forEach(([key, value]) => {
        root.style.setProperty(`--color-gray-${key}`, value);
      });
      
      // Background colors
      Object.entries(colors.background).forEach(([key, value]) => {
        root.style.setProperty(`--color-bg-${key}`, value);
      });
      
      // Text colors
      Object.entries(colors.text).forEach(([key, value]) => {
        root.style.setProperty(`--color-text-${key}`, value);
      });
      
      // Border colors
      Object.entries(colors.border).forEach(([key, value]) => {
        root.style.setProperty(`--color-border-${key}`, value);
      });
      
      // Status colors
      root.style.setProperty('--color-success', colors.success);
      root.style.setProperty('--color-warning', colors.warning);
      root.style.setProperty('--color-error', colors.error);
      root.style.setProperty('--color-info', colors.info);
      
      // Shadows
      Object.entries(themeConfig.shadows).forEach(([key, value]) => {
        root.style.setProperty(`--shadow-${key}`, value);
      });
      
      // Border radius
      Object.entries(themeConfig.radius).forEach(([key, value]) => {
        root.style.setProperty(`--radius-${key}`, value);
      });
      
      // Animations
      Object.entries(themeConfig.animations).forEach(([key, value]) => {
        root.style.setProperty(`--animation-${key}`, value);
      });
      
      // Fonts
      root.style.setProperty('--font-sans', themeConfig.fonts.sans.join(', '));
      root.style.setProperty('--font-mono', themeConfig.fonts.mono.join(', '));
    }
  }, [currentTheme, themeConfig, availableThemes]);

  const value = {
    currentTheme,
    themeConfig,
    setTheme,
    toggleTheme,
    availableThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};