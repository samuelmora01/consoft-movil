import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { API } from '../config';
import { UsersApi, AuthApi, forceLogout } from '../api/client';
import { useSessionStore } from '../store/sessionStore';
import { useUserStore } from '../store/userStore';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { theme, toggleMode } = useTheme();
  const [me, setMe] = useState<any | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const setSignedIn = useSessionStore((s) => s.setSignedIn);
  const setContact = useUserStore((s) => s.setContact);
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try {
          if (!API) return;
          const res = await UsersApi(API).me();
          const u: any = (res as any)?.user || res;
          setMe(u);
        } catch {}
      })();
      return () => {};
    }, [])
  );
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header con avatar y nombre */}
      <View style={[styles.profileHeader, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.avatarContainer, { borderColor: theme.colors.border }]}>
          <Image 
            source={{ uri: (me && (me.avatarUrl || me.profile_picture || me.photoUrl)) || 'https://i.pravatar.cc/120?img=5' }} 
            style={styles.avatar} 
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {(me && (me.name || me.email)) || 'Usuario'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.muted }]}>
            {(me && me.email) || '-'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.editIconButton, { backgroundColor: theme.colors.primary + '15' }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sección de preferencias */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.muted }]}>PREFERENCIAS</Text>
        <View style={[styles.menuCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="moon" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Modo Oscuro</Text>
            </View>
            <Switch
              value={theme.mode === 'dark'}
              onValueChange={toggleMode}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primary + '40' }}
              thumbColor={theme.mode === 'dark' ? theme.colors.primary : '#FFFFFF'}
            />
          </View>
        </View>
      </View>

      {/* Sección de cuenta */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.muted }]}>MI CUENTA</Text>
        <View style={[styles.menuCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} 
            onPress={() => navigation.navigate('CartHome' as never)}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="cart-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Mi carrito</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} 
            onPress={() => navigation.navigate('ChatRoot')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Chat con soporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Cambiar contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* Botón de cerrar sesión */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.colors.card, borderColor: '#FCA5A5' }]}
        onPress={async () => {
          // Confirmación antes de cerrar sesión
          Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de que quieres cerrar sesión?',
            [
              {
                text: 'Cancelar',
                style: 'cancel',
              },
              {
                text: 'Cerrar Sesión',
                style: 'destructive',
                onPress: async () => {
                  setLoggingOut(true);
                  try {
                    // Usar la función forceLogout optimizada
                    await forceLogout(API);
                    
                    // Limpiar estado local
                    setContact({ backupEmail: '', backupPhone: '', defaultAddress: '' });
                    
                    // El estado de sesión ya se actualizó en forceLogout
                    
                    // Mostrar mensaje de éxito
                    Alert.alert(
                      'Sesión Cerrada',
                      'Has cerrado sesión correctamente.',
                      [{ text: 'OK' }]
                    );
                  } catch (error) {
                    console.error('Error during logout:', error);
                    
                    // Even if backend fails, clear local state
                    setContact({ backupEmail: '', backupPhone: '', defaultAddress: '' });
                    setSignedIn(false);
                    
                    Alert.alert(
                      'Sesión Cerrada',
                      'Se ha cerrado la sesión localmente.',
                      [{ text: 'OK' }]
                    );
                  } finally {
                    setLoggingOut(false);
                  }
                },
              },
            ]
          );
        }}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator size="small" color="#DC2626" />
        ) : (
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          </View>
        )}
        <Text style={styles.logoutText}>
          {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
        </Text>
      </TouchableOpacity>

     
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    padding: 3,
  },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  userInfo: { flex: 1, marginLeft: 16 },
  userName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  userEmail: { fontSize: 14 },
  editIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { fontSize: 16, fontWeight: '600' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 20,
  },
  logoutIcon: { marginRight: 8 },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 16 },
  emergencyButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  emergencyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
