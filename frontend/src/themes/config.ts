// Theme Types and Configuration
export type ThemeVariant = 'light' | 'dark' | 'cyber' | 'cute';

export interface ThemeColors {
  // Primary colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Secondary colors
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Neutral colors
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  
  // Border colors
  border: {
    primary: string;
    secondary: string;
    focus: string;
  };
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeConfig {
  name: string;
  displayName: string;
  colors: ThemeColors;
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  fonts: {
    sans: string[];
    mono: string[];
  };
  animations: {
    fast: string;
    medium: string;
    slow: string;
  };
}

// Light Theme
export const lightTheme: ThemeConfig = {
  name: 'light',
  displayName: 'Light Mode',
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
    },
    text: {
      primary: '#111827',
      secondary: '#374151',
      tertiary: '#6b7280',
      inverse: '#ffffff',
    },
    border: {
      primary: '#e5e7eb',
      secondary: '#d1d5db',
      focus: '#3b82f6',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  radius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  fonts: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  animations: {
    fast: '150ms ease-in-out',
    medium: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
};

// Dark Theme
export const darkTheme: ThemeConfig = {
  name: 'dark',
  displayName: 'Dark Mode',
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    background: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      tertiary: '#2a2a2a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#e5e7eb',
      tertiary: '#9ca3af',
      inverse: '#000000',
    },
    border: {
      primary: '#374151',
      secondary: '#4b5563',
      focus: '#3b82f6',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
  },
  radius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  fonts: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  animations: {
    fast: '150ms ease-in-out',
    medium: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
};

// Cyber Theme
export const cyberTheme: ThemeConfig = {
  name: 'cyber',
  displayName: 'Cyber Mode',
  colors: {
    primary: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },
    secondary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    gray: {
      50: '#0a0a0b',
      100: '#1a1a1b',
      200: '#2a2a2b',
      300: '#3a3a3b',
      400: '#4a4a4b',
      500: '#5a5a5b',
      600: '#6a6a6b',
      700: '#7a7a7b',
      800: '#8a8a8b',
      900: '#9a9a9b',
    },
    background: {
      primary: '#050505',
      secondary: '#0f0f0f',
      tertiary: '#1a1a1a',
    },
    text: {
      primary: '#00ffff',
      secondary: '#00ff00',
      tertiary: '#ffffff',
      inverse: '#000000',
    },
    border: {
      primary: '#00ffff',
      secondary: '#00ff00',
      focus: '#ff00ff',
    },
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#00ffff',
  },
  shadows: {
    sm: '0 0 10px rgba(0, 255, 255, 0.3)',
    md: '0 0 20px rgba(0, 255, 255, 0.4)',
    lg: '0 0 30px rgba(0, 255, 255, 0.5)',
    xl: '0 0 40px rgba(0, 255, 255, 0.6)',
  },
  radius: {
    sm: '0rem',
    md: '0rem',
    lg: '0rem',
    xl: '0rem',
  },
  fonts: {
    sans: ['Orbitron', 'monospace'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  animations: {
    fast: '100ms linear',
    medium: '200ms linear',
    slow: '400ms linear',
  },
};

// Cute Theme
export const cuteTheme: ThemeConfig = {
  name: 'cute',
  displayName: 'Cute Mode',
  colors: {
    primary: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
    },
    secondary: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
    gray: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
    },
    background: {
      primary: '#fff1f5',
      secondary: '#ffe4f1',
      tertiary: '#fbd7ed',
    },
    text: {
      primary: '#831843',
      secondary: '#be185d',
      tertiary: '#db2777',
      inverse: '#ffffff',
    },
    border: {
      primary: '#f9a8d4',
      secondary: '#f472b6',
      focus: '#ec4899',
    },
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#ec4899',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(236 72 153 / 0.1)',
    md: '0 4px 6px -1px rgb(236 72 153 / 0.2), 0 2px 4px -2px rgb(236 72 153 / 0.2)',
    lg: '0 10px 15px -3px rgb(236 72 153 / 0.2), 0 4px 6px -4px rgb(236 72 153 / 0.2)',
    xl: '0 20px 25px -5px rgb(236 72 153 / 0.2), 0 8px 10px -6px rgb(236 72 153 / 0.2)',
  },
  radius: {
    sm: '1rem',
    md: '1.25rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  fonts: {
    sans: ['Nunito', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  animations: {
    fast: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    medium: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '600ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Export all themes
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  cyber: cyberTheme,
  cute: cuteTheme,
} as const;

export const themeList = Object.values(themes);