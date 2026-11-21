import type { ThemeId } from '../domain/types';

export interface Theme {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentInk: string;
  accentText: string;
  border: string;
  borderStrong: string;
  danger: string;
  track: string;
}

export const DARK: Theme = {
  background: '#0F1419',
  surface: '#161C23',
  surfaceAlt: '#1E262F',
  text: '#F3F1EA',
  textMuted: '#9AA3AC',
  textFaint: '#6C7680',
  accent: '#D9B44A',
  accentInk: '#E4C462',
  accentText: '#161206',
  border: '#273039',
  borderStrong: '#3A4550',
  danger: '#E5484D',
  track: '#2B3540',
};

export const LIGHT: Theme = {
  background: '#F4F2EC',
  surface: '#FFFFFF',
  surfaceAlt: '#EDEAE1',
  text: '#141A20',
  textMuted: '#5E6A74',
  textFaint: '#8A939B',
  accent: '#C39A2B',
  accentInk: '#8A6710',
  accentText: '#1A1404',
  border: '#E0DCD0',
  borderStrong: '#CFC9BA',
  danger: '#C0392B',
  track: '#E4DFD2',
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
