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
import { API } from './src/config';
import { AuthApi } from './src/api/client';
import { useAppStore } from './src/store/appStore';
import { useToast } from './src/ui/ToastProvider';
import { createSocket } from './src/realtime/socket';
import { listAdminConversations, listDmConversations } from './src/features/chat/chatService';

function NavigationRoot() {
  const { theme } = useTheme();
  const seedAppointments = useAppStore((s) => s.seedAppointments);
  const hasAppointments = useAppStore((s) => s.appointments.length > 0);
  const [useCustomer, setUseCustomer] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const signIn = useAppStore((s) => s.signIn);
  const setProfile = useAppStore((s) => s.setProfile);
  const { show } = useToast();
  const incrementChatUnread = useAppStore((s) => s.incrementChatUnread);

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
  useEffect(() => {
    (async () => {
      if (!API) {
        setBootstrapped(true);
        return;
      }
      try {
        let me: any;
        try {
          me = await (await import('./src/api/client')).UsersApi(API).me();
        } catch {
          me = await AuthApi(API).me();
        }
        const u = (me && (me.user || me)) || {};
        if (u && (u.email || u.name || u.fullName)) {
          setProfile({
            name: u.name || u.fullName || u.email,
            email: u.email,
            phone: u.phone,
            address: u.address,
            avatarUrl: u.avatarUrl || u.profile_picture || u.photoUrl,
          });
        }
        signIn('me');
        // Join all known conversations to receive new message events and reflect badge
        try {
          const s = createSocket(API);
          const [orders, dms] = await Promise.all([listAdminConversations(), listDmConversations()]);
          orders.forEach((c) => {
            s.emit('order:join', { orderId: c.id });
            s.emit('quotation:join', { quotationId: c.id });
          });
          dms.forEach((dm) => {
            s.emit('chat:join', { roomId: dm.id, peer: 'admin@admin.com' });
          });
          s.on('chat:message', () => {
            incrementChatUnread();
          });
        } catch {}
      } catch {
        // not signed in; ignore
      } finally {
        setBootstrapped(true);
      }
    })();
  }, [signIn, setProfile, incrementChatUnread]);
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
      {bootstrapped ? (useCustomer ? <CustomerNavigator /> : <AppNavigator />) : null}
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
