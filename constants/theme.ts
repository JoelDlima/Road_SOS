export const Colors = {
  background: '#07090D',
  canvas: '#0B0F15',
  surface: '#111720',
  surface2: '#18212D',
  surface3: '#222C39',
  border: 'rgba(226,236,255,0.10)',
  borderStrong: 'rgba(226,236,255,0.18)',
  sosRed: '#E83F42',
  sosRedGlow: 'rgba(232,63,66,0.24)',
  safeGreen: '#2EC27E',
  warningAmber: '#F6A723',
  infoBlue: '#3B82F6',
  textPrimary: '#F7FAFC',
  textMuted: '#A8B3C5',
  textFaint: '#6F7A8C',
  indigoAccent: '#7C6EF6',
};

export const Radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  pill: 999,
  card: 12,
  input: 10,
};

export const Typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '900' as const, letterSpacing: 0 },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const, letterSpacing: 0 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '800' as const, letterSpacing: 0 },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const, letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 0 },
  button: { fontSize: 14, lineHeight: 20, fontWeight: '700' as const, letterSpacing: 0 },
  buttonLarge: { fontSize: 16, lineHeight: 24, fontWeight: '800' as const, letterSpacing: 0 },
  mono: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, fontFamily: 'monospace' },
};

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 24, stiffness: 200 },
  springSnappy: { damping: 26, stiffness: 220 },
};

export const ServiceTypeColors: Record<string, string> = {
  hospital: '#0A84FF',
  trauma_centre: '#FF3B3B',
  ambulance: '#FF9F0A',
  police: '#5E5CE6',
  fire_station: '#FF9500',
  towing: '#32D74B',
  puncture: '#FF6B35',
  showroom: '#64D2FF',
};

export const ServiceTypeLabels: Record<string, string> = {
  hospital: 'Hospital',
  trauma_centre: 'Trauma Centre',
  ambulance: 'Ambulance',
  police: 'Police',
  fire_station: 'Fire Station',
  towing: 'Towing',
  puncture: 'Puncture',
  showroom: 'Showroom',
};
