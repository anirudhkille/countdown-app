import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getActiveThemeId, getFontKey, setActiveThemeId, setFontKey } from '../data/settings';
import { fontFamilyFor } from './fonts';
import { DEFAULT_THEME_ID, getTheme, type Theme } from './themes';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  themeId: string;
  fontKey: string;
  fontFamily: string | undefined;
  setThemeId: (id: string) => Promise<void>;
  setFontKey: (key: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [themeId, setThemeIdState] = useState<string>(DEFAULT_THEME_ID);
  const [fontKey, setFontKeyState] = useState<string>('System');

  useEffect(() => {
    let active = true;
    void (async () => {
      const [storedTheme, storedFont] = await Promise.all([getActiveThemeId(), getFontKey()]);
      if (!active) return;
      setThemeIdState(storedTheme);
      setFontKeyState(storedFont);
    })();
    return () => {
      active = false;
    };
  }, []);

  const systemDark = scheme !== 'light';
  const isDark = themeId === 'dark' || (themeId === 'system' && systemDark);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: getTheme(themeId, systemDark),
      isDark,
      themeId,
      fontKey,
      fontFamily: fontFamilyFor(fontKey),
      setThemeId: async (id: string) => {
        setThemeIdState(id);
        await setActiveThemeId(id);
      },
      setFontKey: async (key: string) => {
        setFontKeyState(key);
        await setFontKey(key);
      },
    }),
    [themeId, isDark, systemDark, fontKey]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

export function useThemeControls(): ThemeContextValue {
  return useThemeContext();
}

export function useFontFamily(): string | undefined {
  return useThemeContext().fontFamily;
}
