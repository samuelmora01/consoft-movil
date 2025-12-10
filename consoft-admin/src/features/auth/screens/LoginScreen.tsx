import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useAppStore } from '../../../store/appStore';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const { theme } = useTheme();
  const signIn = useAppStore((s) => s.signIn);
  const navigation = useNavigation();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }] }>
      <Text style={[styles.title, { color: theme.colors.text }]}>Confort & Estilo</Text>
      <Text style={{ color: theme.colors.muted, textAlign: 'center', marginBottom: 18 }}>Ingresa con tu correo para continuar</Text>
      <TextInput placeholder="Correo electrónico" placeholderTextColor={theme.colors.muted} autoCapitalize="none" keyboardType="email-address" style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]} />
      <TextInput placeholder="Ingresar tu contraseña" secureTextEntry placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]} />
      <TouchableOpacity style={{ marginTop: 8, alignSelf: 'flex-end' }}>
        <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} onPress={() => signIn()}> 
        <Text style={styles.primaryText}>Iniciar sesión</Text>
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



