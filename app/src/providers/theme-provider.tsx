import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { createContext, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

import { DARK, LIGHT, type ThemeColors } from '@/shared/constants/colors';
import { getJson, setJson } from '@/shared/storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  mode: ThemeMode;
  colorScheme: 'light' | 'dark';
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceScheme = useDeviceColorScheme();
  const { setColorScheme: setNWColorScheme } = useNativeWindColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const loadTheme = async () => {
      const savedMode = await getJson<ThemeMode>(STORAGE_KEY, 'system');
      setModeState(savedMode);
      
      const resolved = savedMode === 'system' ? (deviceScheme ?? 'light') : savedMode;
      setNWColorScheme(resolved);
    };
    
    loadTheme();
  }, [deviceScheme, setNWColorScheme]);

  const resolvedScheme = mode === 'system' ? (deviceScheme ?? 'light') : mode;
  const colors = resolvedScheme === 'dark' ? DARK : LIGHT;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colorScheme: resolvedScheme,
      colors,
      setMode: (nextMode) => {
        setModeState(nextMode);
        const resolved = nextMode === 'system' ? (deviceScheme ?? 'light') : nextMode;
        setNWColorScheme(resolved);
        void setJson(STORAGE_KEY, nextMode);
      },
    }),
    [mode, resolvedScheme, colors, deviceScheme, setNWColorScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
