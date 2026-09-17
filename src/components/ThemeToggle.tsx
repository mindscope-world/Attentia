import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'button' | 'segmented' | 'compact';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  className = '',
  showLabel = false,
}) => {
  const { theme, toggleTheme, setTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div 
        id="theme-segmented-selector"
        className={`inline-flex items-center p-1 rounded-xl bg-[#0f1020] border border-[#232646] ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#6b45f6] text-white shadow-sm'
              : 'text-[#8288aa] hover:text-white'
          }`}
          aria-label="Switch to dark mode"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-[#8288aa] hover:text-white'
          }`}
          aria-label="Switch to light mode"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>
      </div>
    );
  }

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      className={`group relative flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer ${
        theme === 'dark'
          ? 'bg-[#151730] hover:bg-[#1f2245] text-[#b6bfe3] hover:text-white border border-[#2a2d52]'
          : 'bg-white hover:bg-slate-100 text-amber-600 hover:text-amber-700 border border-slate-200 shadow-sm'
      } ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {theme === 'dark' ? (
          <Moon className="w-4 h-4 text-indigo-300 transition-transform duration-300 group-hover:-rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-medium tracking-tight">
          {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
        </span>
      )}
    </button>
  );
};
