import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme, createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Platform } from 'react-native';
import AuthNavigator from './src/navigation/AuthNavigator';
import CustomerNavigator from './src/navigation/CustomerNavigator';
import { ToastProvider } from './src/ui/ToastProvider';
import { ThemeProvider, useTheme, lightTheme, darkTheme } from './src/theme/theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import { API } from './src/config';
import { AuthApi } from './src/api/client';
import { useSessionStore } from './src/store/sessionStore';

function NavigationRoot() {
  const { theme } = useTheme();
  const bootRef = useRef(false);
  // Evitar seleccionar arrays/objetos que cambien de referencia en cada render
  const isSignedIn = useSessionStore((s) => s.isSignedIn);
  const setSignedIn = useSessionStore((s) => s.setSignedIn);
  const [bootstrapped, setBootstrapped] = useState(false);
  const navRef = useRef(createNavigationContainerRef());
  const navigationTheme = useMemo(() => {
    return theme.mode === 'dark'
      ? { ...NavigationDarkTheme, colors: { ...NavigationDarkTheme.colors, primary: theme.colors.primary, background: theme.colors.background, card: theme.colors.card, text: theme.colors.text, border: theme.colors.border } }
      : { ...NavigationLightTheme, colors: { ...NavigationLightTheme.colors, primary: theme.colors.primary, background: theme.colors.background, card: theme.colors.card, text: theme.colors.text, border: theme.colors.border } };
  }, [theme]);
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 12);
  useEffect(() => {
    (async () => {
      if (!API) {
        setBootstrapped(true);
        return;
      }
      try {
        await AuthApi(API).me();
        setSignedIn(true);
      } catch {
        setSignedIn(false);
      } finally {
        setBootstrapped(true);
      }
    })();
  }, []);
  // Si cambia la sesión, forzar root adecuado y ruta inicial
  useEffect(() => {
    if (!bootstrapped) return;
    const ref = navRef.current;
    if (!ref?.isReady?.()) return;
    if (isSignedIn) {
      ref.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { 
              name: 'Inicio' as never,
              state: {
                index: 0,
                routes: [{ name: 'SearchHome' as never }]
              }
            }
          ], // Ir al tab de Inicio y directamente a SearchHome
        })
      );
    } else {
      ref.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' } as never],
        })
      );
    }
  }, [isSignedIn, bootstrapped]);
  return (
    <View style={{ flex: 1, paddingTop: topPad, backgroundColor: theme.colors.background }}>
      <NavigationContainer ref={navRef as any} theme={navigationTheme} key={isSignedIn ? 'main-nav' : 'auth-nav'}>
        {bootstrapped ? (isSignedIn ? <CustomerNavigator /> : <AuthNavigator />) : null}
        <StatusBar style="auto" />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialTheme={darkTheme}>
        <ToastProvider>
          <NavigationRoot />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
