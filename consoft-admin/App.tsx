import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { ThemeProvider, useTheme, lightTheme, darkTheme } from './src/theme/theme';
import { useAppStore } from './src/store/appStore';
import AppNavigator from './src/navigation/AppNavigator';
import CustomerNavigator from './src/navigation/CustomerNavigator';
import { ToastProvider } from './src/ui/ToastProvider';

function NavigationRoot() {
  const { theme } = useTheme();
  const seedAppointments = useAppStore((s) => s.seedAppointments);
  const hasAppointments = useAppStore((s) => s.appointments.length > 0);
  const [useCustomer, setUseCustomer] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const path = window.location.pathname || '';
      if (path.startsWith('/customer')) {
        setUseCustomer(true);
      }
    }
    if (!hasAppointments) {
      try { seedAppointments(6); } catch {}
    }
  }, []);
  const navigationTheme = useMemo(() => {
    return theme.mode === 'dark'
      ? {
          ...NavigationDarkTheme,
          colors: {
            ...NavigationDarkTheme.colors,
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.card,
            text: theme.colors.text,
            border: theme.colors.border,
          },
        }
      : {
          ...NavigationLightTheme,
          colors: {
            ...NavigationLightTheme.colors,
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.card,
            text: theme.colors.text,
            border: theme.colors.border,
          },
        };
  }, [theme]);

  return (
    <NavigationContainer theme={navigationTheme}>
      {useCustomer ? <CustomerNavigator /> : <AppNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider initialTheme={lightTheme}>
      <SafeAreaProvider>
        <ToastProvider>
          <StatusBar style="auto" />
          <NavigationRoot />
        </ToastProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
