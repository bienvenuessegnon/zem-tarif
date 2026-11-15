export const espace = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const rayon = {
  sm: 10,
  md: 16,
  lg: 24,
  full: 999,
} as const;

export const ombreCarte = {
  shadowColor: '#111111',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 24,
  elevation: 8,
} as const;

export const ombreLegere = {
  shadowColor: '#111111',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
} as const;
