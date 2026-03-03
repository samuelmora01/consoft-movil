import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useAppStore } from '../../../store/appStore';
import { useNavigation } from '@react-navigation/native';
import { API } from '../../../config';
import { AuthApi, UsersApi } from '../../../api/client';

export default function LoginScreen() {
  const { theme } = useTheme();
  const signIn = useAppStore((s) => s.signIn);
  const setProfile = useAppStore((s) => s.setProfile);
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }] }>
      <Text style={[styles.title, { color: theme.colors.text }]}>Confort & Estilo</Text>
      <Text style={{ color: theme.colors.muted, textAlign: 'center', marginBottom: 18 }}>Ingresa con tu correo para continuar</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="Correo electrónico" placeholderTextColor={theme.colors.muted} autoCapitalize="none" keyboardType="email-address" style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Ingresar tu contraseña" secureTextEntry placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]} />
      {error ? <Text style={{ color: theme.colors.danger, marginTop: 4 }}>{error}</Text> : null}
      <TouchableOpacity style={{ marginTop: 8, alignSelf: 'flex-end' }} onPress={() => navigation.navigate('ForgotPassword' as never)}>
        <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>
      <TouchableOpacity
        disabled={loading}
        style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, opacity: loading ? 0.7 : 1 }]}
        onPress={async () => {
          try {
            setError(null);
            if (!API) { setError('Configura la URL del API'); return; }
            if (!email.trim() || !password) { setError('Completa correo y contraseña'); return; }
            setLoading(true);
            await AuthApi(API).login(email.trim(), password);
            // Si login OK, consultamos el perfil
            let me: any;
            try { me = await UsersApi(API).me(); } catch { me = await AuthApi(API).me(); }
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
            signIn(email.trim());
          } catch (e) {
            const msg = (e as Error)?.message || 'Error al iniciar sesión';
            setError(msg);
          } finally {
            setLoading(false);
          }
        }}
      > 
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Iniciar sesión</Text>}
      </TouchableOpacity>
      
      <View style={{ height: 20 }} />
      <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.colors.primary }]} onPress={() => navigation.navigate('Register' as never)}>
        <Text style={[styles.secondaryText, { color: theme.colors.primary }]}>Crear cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, padding: 14, borderRadius: 12, marginBottom: 12 },
  primaryBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, marginTop: 8 },
  secondaryText: { fontWeight: '700' },
});



