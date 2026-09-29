import type { ThemeId } from '../domain/types';

export interface Theme {
  id: ThemeId;
  label: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  border: string;
}

export const THEMES: Theme[] = [
  {
    id: 'default',
    label: 'Midnight',
    background: '#0B0B0F',
    surface: '#16161D',
    surfaceAlt: '#1F1F29',
    text: '#F5F5F7',
    textMuted: '#8E8E99',
    accent: '#6C5CE7',
    accentText: '#FFFFFF',
    border: '#2A2A36',
  },
  {
    id: 'sunrise',
    label: 'Sunrise',
    background: '#FFF8F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F3E8DA',
    text: '#2B1B12',
    textMuted: '#8A7461',
    accent: '#E8590C',
    accentText: '#FFFFFF',
    border: '#EADFD2',
  },
  {
    id: 'forest',
    label: 'Forest',
    background: '#0E1512',
    surface: '#151E1A',
    surfaceAlt: '#1D2A24',
    text: '#EAF3EE',
    textMuted: '#8AA396',
    accent: '#2F9E68',
    accentText: '#06120C',
    border: '#27362E',
  },
  {
    id: 'mono',
    label: 'Mono',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceAlt: '#EBEBEB',
    text: '#111111',
    textMuted: '#767676',
    accent: '#111111',
    accentText: '#FFFFFF',
    border: '#DEDEDE',
  },
];

export const DEFAULT_THEME_ID = 'default';

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
