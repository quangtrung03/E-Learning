import { useTheme } from './ThemeContext';
import type { ThemeVariant, ThemeConfig } from './config';
import { themes } from './config';

// Utility function to get theme-aware classes
export const useThemeClasses = () => {
  const { currentTheme, themeConfig } = useTheme();

  const getThemedClass = (classMap: Partial<Record<ThemeVariant, string>>) => {
    return classMap[currentTheme] || classMap.light || '';
  };

  const getBackgroundClass = (level: 'primary' | 'secondary' | 'tertiary' = 'primary') => {
    return getThemedClass({
      light: level === 'primary' ? 'bg-white' : level === 'secondary' ? 'bg-gray-50' : 'bg-gray-100',
      dark: level === 'primary' ? 'bg-gray-900' : level === 'secondary' ? 'bg-gray-800' : 'bg-gray-700',
      cyber: level === 'primary' ? 'bg-black' : level === 'secondary' ? 'bg-gray-900' : 'bg-gray-800',
      cute: level === 'primary' ? 'bg-pink-50' : level === 'secondary' ? 'bg-pink-100' : 'bg-pink-200',
    });
  };

  const getTextClass = (level: 'primary' | 'secondary' | 'tertiary' = 'primary') => {
    return getThemedClass({
      light: level === 'primary' ? 'text-gray-900' : level === 'secondary' ? 'text-gray-700' : 'text-gray-500',
      dark: level === 'primary' ? 'text-white' : level === 'secondary' ? 'text-gray-200' : 'text-gray-400',
      cyber: level === 'primary' ? 'text-cyan-400' : level === 'secondary' ? 'text-green-400' : 'text-white',
      cute: level === 'primary' ? 'text-pink-900' : level === 'secondary' ? 'text-pink-700' : 'text-pink-500',
    });
  };

  const getBorderClass = (level: 'primary' | 'secondary' | 'focus' = 'primary') => {
    return getThemedClass({
      light: level === 'primary' ? 'border-gray-200' : level === 'secondary' ? 'border-gray-300' : 'border-blue-500',
      dark: level === 'primary' ? 'border-gray-700' : level === 'secondary' ? 'border-gray-600' : 'border-blue-500',
      cyber: level === 'primary' ? 'border-cyan-400' : level === 'secondary' ? 'border-green-400' : 'border-purple-500',
      cute: level === 'primary' ? 'border-pink-200' : level === 'secondary' ? 'border-pink-300' : 'border-pink-500',
    });
  };

  const getButtonClass = (variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' = 'primary') => {
    const baseClasses = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variantClasses = getThemedClass({
      light: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline: 'border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-600 hover:text-white focus:ring-blue-500',
      }[variant],
      dark: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-gray-500',
        ghost: 'text-gray-300 hover:bg-gray-800 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline: 'border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-600 hover:text-white focus:ring-blue-500',
      }[variant],
      cyber: {
        primary: 'bg-cyan-500 text-black hover:bg-cyan-400 focus:ring-cyan-500 shadow-lg shadow-cyan-500/25',
        secondary: 'bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black focus:ring-cyan-500',
        ghost: 'text-cyan-400 hover:bg-cyan-400/10 focus:ring-cyan-500',
        danger: 'bg-red-500 text-white hover:bg-red-400 focus:ring-red-500 shadow-lg shadow-red-500/25',
        outline: 'border-2 border-cyan-400 text-cyan-400 bg-transparent hover:bg-cyan-400 hover:text-black focus:ring-cyan-500',
      }[variant],
      cute: {
        primary: 'bg-pink-500 text-white hover:bg-pink-600 focus:ring-pink-500 rounded-full shadow-lg shadow-pink-500/25',
        secondary: 'bg-pink-100 text-pink-700 hover:bg-pink-200 focus:ring-pink-500 rounded-full',
        ghost: 'text-pink-700 hover:bg-pink-100 focus:ring-pink-500 rounded-full',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 rounded-full shadow-lg shadow-red-500/25',
        outline: 'border-2 border-pink-500 text-pink-500 bg-transparent hover:bg-pink-500 hover:text-white focus:ring-pink-500 rounded-full',
      }[variant],
    });

    return `${baseClasses} ${variantClasses}`;
  };

  const getCardClass = () => {
    const baseClasses = 'rounded-lg p-6 shadow-sm';
    const themeClasses = getThemedClass({
      light: 'bg-white border border-gray-200',
      dark: 'bg-gray-800 border border-gray-700',
      cyber: 'bg-gray-900 border border-cyan-400 shadow-lg shadow-cyan-400/10',
      cute: 'bg-white border-2 border-pink-200 shadow-lg shadow-pink-500/10 rounded-2xl',
    });

    return `${baseClasses} ${themeClasses}`;
  };

  const getInputClass = () => {
    const baseClasses = 'block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
    const themeClasses = getThemedClass({
      light: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500',
      dark: 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500',
      cyber: 'bg-black border-cyan-400 text-cyan-400 placeholder-gray-500 focus:border-green-400 focus:ring-green-400',
      cute: 'bg-white border-pink-300 text-pink-900 placeholder-pink-400 focus:border-pink-500 focus:ring-pink-500 rounded-full',
    });

    return `${baseClasses} ${themeClasses}`;
  };

  return {
    getThemedClass,
    getBackgroundClass,
    getTextClass,
    getBorderClass,
    getButtonClass,
    getCardClass,
    getInputClass,
    currentTheme,
    themeConfig,
  };
};

// Animation utilities based on theme
export const useThemeAnimations = () => {
  const { currentTheme } = useTheme();

  const getAnimationProps = (animationType: 'fade' | 'slide' | 'scale' | 'bounce') => {
    const baseAnimations = {
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      },
      slide: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
      },
      scale: {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
      },
      bounce: {
        initial: { opacity: 0, scale: 0.3 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.3 },
      },
    };

    const themeTransitions = {
      light: { duration: 0.3, ease: 'easeInOut' },
      dark: { duration: 0.3, ease: 'easeInOut' },
      cyber: { duration: 0.2, ease: 'linear' },
      cute: { 
        duration: 0.4, 
        ease: 'easeOut',
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    };

    return {
      ...baseAnimations[animationType],
      transition: themeTransitions[currentTheme],
    };
  };

  const getHoverProps = () => {
    return {
      light: { scale: 1.02 },
      dark: { scale: 1.02 },
      cyber: { scale: 1.05, boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' },
      cute: { scale: 1.05, rotate: 2 },
    }[currentTheme];
  };

  const getTapProps = () => {
    return {
      light: { scale: 0.98 },
      dark: { scale: 0.98 },
      cyber: { scale: 0.95 },
      cute: { scale: 0.95, rotate: -1 },
    }[currentTheme];
  };

  return {
    getAnimationProps,
    getHoverProps,
    getTapProps,
  };
};

// Theme-aware icon utility function
export const getThemedIconClass = (currentTheme: ThemeVariant): string => {
  switch (currentTheme) {
    case 'light': return 'text-gray-600';
    case 'dark': return 'text-gray-400';
    case 'cyber': return 'text-cyan-400';
    case 'cute': return 'text-pink-500';
    default: return 'text-gray-600';
  }
};

// Utility to generate CSS variables for a theme
export const generateThemeCSS = (theme: ThemeConfig): string => {
  const cssVars: string[] = [];
  
  // Colors
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    cssVars.push(`--color-primary-${key}: ${value};`);
  });
  
  Object.entries(theme.colors.secondary).forEach(([key, value]) => {
    cssVars.push(`--color-secondary-${key}: ${value};`);
  });
  
  Object.entries(theme.colors.gray).forEach(([key, value]) => {
    cssVars.push(`--color-gray-${key}: ${value};`);
  });
  
  Object.entries(theme.colors.background).forEach(([key, value]) => {
    cssVars.push(`--color-bg-${key}: ${value};`);
  });
  
  Object.entries(theme.colors.text).forEach(([key, value]) => {
    cssVars.push(`--color-text-${key}: ${value};`);
  });
  
  Object.entries(theme.colors.border).forEach(([key, value]) => {
    cssVars.push(`--color-border-${key}: ${value};`);
  });
  
  // Status colors
  cssVars.push(`--color-success: ${theme.colors.success};`);
  cssVars.push(`--color-warning: ${theme.colors.warning};`);
  cssVars.push(`--color-error: ${theme.colors.error};`);
  cssVars.push(`--color-info: ${theme.colors.info};`);
  
  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    cssVars.push(`--shadow-${key}: ${value};`);
  });
  
  // Border radius
  Object.entries(theme.radius).forEach(([key, value]) => {
    cssVars.push(`--radius-${key}: ${value};`);
  });
  
  // Fonts
  cssVars.push(`--font-sans: ${theme.fonts.sans.join(', ')};`);
  cssVars.push(`--font-mono: ${theme.fonts.mono.join(', ')};`);
  
  // Animations
  Object.entries(theme.animations).forEach(([key, value]) => {
    cssVars.push(`--animation-${key}: ${value};`);
  });
  
  return `:root.theme-${theme.name} {\n  ${cssVars.join('\n  ')}\n}`;
};

// Generate CSS for all themes
export const generateAllThemesCSS = (): string => {
  return Object.values(themes)
    .map(theme => generateThemeCSS(theme))
    .join('\n\n');
};