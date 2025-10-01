import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Platform } from 'react-native';
import AuthNavigator from './src/navigation/AuthNavigator';
import { ToastProvider } from './src/ui/ToastProvider';
import { ThemeProvider, useTheme, lightTheme, darkTheme } from './src/theme/theme';
import { useMemo } from 'react';

function NavigationRoot() {
  const { theme } = useTheme();
  const navigationTheme = useMemo(() => {
    return theme.mode === 'dark'
      ? { ...NavigationDarkTheme, colors: { ...NavigationDarkTheme.colors, primary: theme.colors.primary, background: theme.colors.background, card: theme.colors.card, text: theme.colors.text, border: theme.colors.border } }
      : { ...NavigationLightTheme, colors: { ...NavigationLightTheme.colors, primary: theme.colors.primary, background: theme.colors.background, card: theme.colors.card, text: theme.colors.text, border: theme.colors.border } };
  }, [theme]);
  const insets = useSafeAreaInsets();
  const androidTopPad = Platform.OS === 'android' ? Math.max(insets.top, 12) : 0;
  return (
    <View style={{ flex: 1, paddingTop: androidTopPad, backgroundColor: theme.colors.background }}>
      <NavigationContainer theme={navigationTheme}>
        <AuthNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialTheme={lightTheme}>
        <ToastProvider>
          <NavigationRoot />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
