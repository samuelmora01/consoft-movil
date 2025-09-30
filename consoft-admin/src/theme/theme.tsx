import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  muted: string;
  danger: string;
  success: string;
  warning: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: (multiplier?: number) => number;
  radius: number;
}

const base = {
  spacing: (m: number = 1) => 8 * m,
  radius: 10,
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#6E3B1E',
    background: '#FFFFFF',
    card: '#F6F2EF',
    text: '#1A1A1A',
    border: '#E3DED9',
    muted: '#8A817C',
    danger: '#E85959',
    success: '#2EB872',
    warning: '#F6C453',
  },
  ...base,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#A66A3E',
    background: '#0F0F0F',
    card: '#1B1B1B',
    text: '#F2F2F2',
    border: '#2A2A2A',
    muted: '#9B9B9B',
    danger: '#FF6B6B',
    success: '#3EDC97',
    warning: '#D9A441',
  },
  ...base,
};

interface ThemeContextValue {
  theme: Theme;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ initialTheme?: Theme; children: React.ReactNode }> = ({
  initialTheme = lightTheme,
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const toggleMode = useCallback(() => {
    setTheme((prev) => (prev.mode === 'light' ? { ...darkTheme } : { ...lightTheme }));
  }, []);

  const setMode = useCallback((mode: ThemeMode) => {
    setTheme(mode === 'light' ? { ...lightTheme } : { ...darkTheme });
  }, []);

  const value = useMemo(() => ({ theme, toggleMode, setMode }), [theme, toggleMode, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}












