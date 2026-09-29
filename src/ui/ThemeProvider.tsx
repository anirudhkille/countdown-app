import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getActiveThemeId, setActiveThemeId } from '../data/settings';
import { DEFAULT_THEME_ID, getTheme, type Theme } from './themes';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  setThemeId: (id: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [themeId, setThemeIdState] = useState<string>(DEFAULT_THEME_ID);

  useEffect(() => {
    let active = true;
    getActiveThemeId().then((id) => {
      if (active) setThemeIdState(id);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: getTheme(themeId),
      isDark: scheme !== 'light',
      setThemeId: async (id: string) => {
        setThemeIdState(id);
        await setActiveThemeId(id);
      },
    }),
    [themeId, scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx.theme;
}

export function useThemeControls(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControls must be used inside <ThemeProvider>');
  return ctx;
}
