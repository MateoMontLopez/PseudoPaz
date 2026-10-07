import { useState, useCallback, useEffect, createContext, useContext } from 'react';

export type AppTheme = 'dark' | 'light';

interface ThemeContextValue {
  theme: AppTheme;
  toggleTheme: () => void;
  isDark: boolean;
}

const STORAGE_KEY = 'pseudopaz_theme_v1';

function loadStoredTheme(): AppTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // silently fallback
  }
  return 'dark';
}

function persistTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // silently fail
  }
}

export function useThemeProvider(): ThemeContextValue {
  const [theme, setTheme] = useState<AppTheme>(loadStoredTheme);

  // Apply the theme class to the document root for CSS custom property switching
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'dark', 'light');
    root.classList.add(`theme-${theme}`);
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    persistTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  };
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
