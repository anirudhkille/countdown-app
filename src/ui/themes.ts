import type { ThemeId } from '../domain/types';

export interface Theme {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  border: string;
}

export const DARK: Theme = {
  background: '#0B0B0F',
  surface: '#16161D',
  surfaceAlt: '#1F1F29',
  text: '#F5F5F7',
  textMuted: '#8E8E99',
  accent: '#6C5CE7',
  accentText: '#FFFFFF',
  border: '#2A2A36',
};

export const LIGHT: Theme = {
  background: '#FFF8F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F3E8DA',
  text: '#2B1B12',
  textMuted: '#8A7461',
  accent: '#E8590C',
  accentText: '#FFFFFF',
  border: '#EADFD2',
};

export const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];

export const DEFAULT_THEME_ID: ThemeId = 'system';

export function getTheme(id: string | null | undefined, isDark: boolean): Theme {
  if (id === 'light') return LIGHT;
  if (id === 'dark') return DARK;
  return isDark ? DARK : LIGHT;
}

export function themeLabel(id: string | null | undefined): string {
  return THEME_OPTIONS.find((option) => option.id === id)?.label ?? 'System';
}
