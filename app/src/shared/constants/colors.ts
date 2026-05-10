export const ACCENT = '#FF7A00';

export const LIGHT = {
  background: '#F7F8FA',
  card: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  accent: ACCENT,
  accentMuted: '#FFF0E0',
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  info: '#3B82F6',
};

export const DARK = {
  background: '#0F172A',
  card: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  accent: ACCENT,
  accentMuted: '#2D1A00',
  success: '#4ADE80',
  warning: '#FACC15',
  error: '#F87171',
  info: '#60A5FA',
};

export type ThemeColors = typeof LIGHT;
