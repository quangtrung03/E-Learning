
import { motion } from 'framer-motion';
import { Sun, Moon, Zap, Heart } from 'lucide-react';
import { useTheme } from './ThemeContext';
import type { ThemeVariant } from './config';

const themeIcons = {
  light: Sun,
  dark: Moon,
  cyber: Zap,
  cute: Heart,
};

const themeLabels = {
  light: 'Sáng',
  dark: 'Tối',
  cyber: 'Cyber',
  cute: 'Đáng yêu',
};

interface ThemeSwitcherProps {
  variant?: 'dropdown' | 'toggle' | 'grid';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const { currentTheme, setTheme, availableThemes, toggleTheme } = useTheme();

  if (variant === 'toggle') {
    const CurrentIcon = themeIcons[currentTheme];
    
    return (
      <motion.button
        onClick={toggleTheme}
        className={`
          relative p-2 rounded-lg border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
          text-gray-700 dark:text-gray-200 transition-colors
          ${className}
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={`Chuyển sang ${themeLabels[currentTheme]}`}
      >
        <CurrentIcon className="w-5 h-5" />
      </motion.button>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        {availableThemes.map((theme) => {
          const Icon = themeIcons[theme];
          const isActive = currentTheme === theme;
          
          return (
            <motion.button
              key={theme}
              onClick={() => setTheme(theme)}
              className={`
                flex items-center justify-center p-3 rounded-lg border-2 transition-all
                ${isActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">{themeLabels[theme]}</span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value as ThemeVariant)}
        className="
          appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
          rounded-lg px-4 py-2 pr-8 text-sm font-medium
          text-gray-700 dark:text-gray-200
          hover:bg-gray-50 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors
        "
      >
        {availableThemes.map((theme) => (
          <option key={theme} value={theme}>
            {themeLabels[theme]}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

// Theme Preview Component
interface ThemePreviewProps {
  theme: ThemeVariant;
  isActive?: boolean;
  onClick?: () => void;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({
  theme,
  isActive = false,
  onClick,
}) => {
  const Icon = themeIcons[theme];
  
  return (
    <motion.div
      onClick={onClick}
      className={`
        cursor-pointer p-4 rounded-xl border-2 transition-all
        ${isActive 
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {themeLabels[theme]}
        </span>
      </div>
      
      {/* Theme color preview */}
      <div className="flex space-x-1">
        <div className={`w-8 h-8 rounded ${getThemePreviewColors(theme).primary}`} />
        <div className={`w-8 h-8 rounded ${getThemePreviewColors(theme).secondary}`} />
        <div className={`w-8 h-8 rounded ${getThemePreviewColors(theme).background}`} />
      </div>
    </motion.div>
  );
};

// Helper function to get preview colors for each theme
const getThemePreviewColors = (theme: ThemeVariant) => {
  switch (theme) {
    case 'light':
      return {
        primary: 'bg-blue-500',
        secondary: 'bg-sky-500',
        background: 'bg-gray-100',
      };
    case 'dark':
      return {
        primary: 'bg-blue-500',
        secondary: 'bg-sky-500',
        background: 'bg-gray-800',
      };
    case 'cyber':
      return {
        primary: 'bg-cyan-400',
        secondary: 'bg-green-400',
        background: 'bg-black',
      };
    case 'cute':
      return {
        primary: 'bg-pink-500',
        secondary: 'bg-yellow-400',
        background: 'bg-pink-50',
      };
    default:
      return {
        primary: 'bg-blue-500',
        secondary: 'bg-sky-500',
        background: 'bg-gray-100',
      };
  }
};