export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 10, md: 16, lg: 20, xl: 26, pill: 999 } as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 38, fontWeight: '700', letterSpacing: -1 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.3 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.4 },
} as const;

export const control = { rowHeight: 56, gutter: 20, tap: 44 } as const;
