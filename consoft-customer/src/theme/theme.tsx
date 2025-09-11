import React, { createContext, useContext, useMemo, useState } from 'react';

export type Theme = {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    muted: string;
    success: string;
    danger: string;
    warning: string;
  };
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#6b4028',
    background: '#ffffff',
    card: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb',
    muted: '#6b7280',
    success: '#16a34a',
    danger: '#dc2626',
    warning: '#f59e0b',
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#caa389',
    background: '#0b0b0b',
    card: '#111111',
    text: '#f3f4f6',
    border: '#1f2937',
    muted: '#9ca3af',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
  },
};

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ initialTheme = lightTheme, children }: { initialTheme?: Theme; children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const value = useMemo(() => ({
    theme,
    toggle: () => setTheme((t) => (t.mode === 'light' ? darkTheme : lightTheme)),
  }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}





