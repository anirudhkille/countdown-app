export interface FontOption {
  key: string;
  label: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { key: 'System', label: 'System' },
  { key: 'Inter_700Bold', label: 'Inter' },
  { key: 'SpaceGrotesk_700Bold', label: 'Space Grotesk' },
  { key: 'PlayfairDisplay_700Bold', label: 'Playfair' },
  { key: 'DMSerifDisplay_400Regular', label: 'DM Serif' },
];

export function fontFamilyFor(key: string | null | undefined): string | undefined {
  if (!key || key === 'System') return undefined;
  if (key === 'Inter_400Regular') return 'Inter_700Bold';
  return key;
}
