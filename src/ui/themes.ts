import type { ThemeId } from '../domain/types';

export interface Theme {
  background: string;
  surface: string;
  surfaceAlt: string;
  header: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  border: string;
}

export const DARK: Theme = {
  background: '#121212',
  surface: '#1F1F1F',
  surfaceAlt: '#2A2A2A',
  header: '#2B2B33',
  text: '#FFFFFF',
  textMuted: '#8A8A8A',
  accent: '#0D9DBB',
  accentText: '#FFFFFF',
  border: '#2E2E2E',
};

export const LIGHT: Theme = {
  background: '#F4F4F6',
  surface: '#FFFFFF',
  surfaceAlt: '#ECECEF',
  header: '#FFFFFF',
  text: '#16181C',
  textMuted: '#6B7280',
  accent: '#0D9DBB',
  accentText: '#FFFFFF',
  border: '#E2E2E6',
};

export const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];

export const DEFAULT_THEME_ID: ThemeId = 'system';

/** Circle interiors in the reference design are always the page background. */
export const RING_INNER = {
  light: '#FFFFFF',
  dark: '#1F1F1F',
} as const;

export function getTheme(id: string | null | undefined, isDark: boolean): Theme {
  if (id === 'light') return LIGHT;
  if (id === 'dark') return DARK;
  return isDark ? DARK : LIGHT;
}

export function themeLabel(id: string | null | undefined): string {
  return THEME_OPTIONS.find((option) => option.id === id)?.label ?? 'System';
}
