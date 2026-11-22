import Storage from 'expo-sqlite/kv-store';
import type { ThemeId } from '../domain/types';

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const raw = await Storage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await Storage.setItem(key, JSON.stringify(value));
}

export type ViewMode = 'grid' | 'list';

export const getViewMode = () => getSetting<ViewMode>('viewMode', 'grid');
export const setViewMode = (mode: ViewMode) => setSetting('viewMode', mode);

export const getActiveThemeId = () => getSetting<ThemeId>('activeThemeId', 'system');
export const setActiveThemeId = (id: ThemeId) => setSetting('activeThemeId', id);

export const getFontKey = () => getSetting<string>('fontKey', 'System');
export const setFontKey = (key: string) => setSetting('fontKey', key);

export type SortKey = 'next' | 'newest' | 'name';

export const getSortKey = () => getSetting<SortKey>('sortKey', 'next');
export const setSortKey = (key: SortKey) => setSetting('sortKey', key);
