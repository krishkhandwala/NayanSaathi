export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentContrast: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  touchTargetOutline: string;
}

export const DARK_THEME: ThemeColors = {
  background: '#12161A',
  surface: '#1A2027',
  surfaceElevated: '#242D38',
  card: '#1F2730',
  text: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  border: '#334155',
  accent: '#00D2A0',
  accentContrast: '#000000',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#38BDF8',
  touchTargetOutline: '#64748B',
};

export const LIGHT_THEME: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#1E293B',
  textMuted: '#475569',
  border: '#CBD5E1',
  accent: '#0D9488',
  accentContrast: '#FFFFFF',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#0284C7',
  touchTargetOutline: '#94A3B8',
};

export const HIGH_CONTRAST_DARK_THEME: ThemeColors = {
  background: '#000000',
  surface: '#0A0A0A',
  surfaceElevated: '#171717',
  card: '#000000',
  text: '#FFFFFF',
  textSecondary: '#FFFF00', // Yellow high contrast
  textMuted: '#E2E8F0',
  border: '#FFFFFF',
  accent: '#00FF66',
  accentContrast: '#000000',
  success: '#00FF66',
  warning: '#FFFF00',
  error: '#FF3333',
  info: '#00E5FF',
  touchTargetOutline: '#FFFFFF',
};

export const ACCESSIBILITY_METRICS = {
  minTouchTargetSize: 48, // 48x48 dp minimum touch target
  minTouchTargetPadding: 12,
  borderRadius: 8,
  borderWidthFocus: 3,
  fontSize: {
    xs: 14,
    sm: 16,
    base: 18,
    lg: 20,
    xl: 24,
    xxl: 32,
    huge: 40,
  },
  lineHeight: {
    sm: 22,
    base: 26,
    lg: 28,
    xl: 32,
    xxl: 40,
    huge: 48,
  },
};
