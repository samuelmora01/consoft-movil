import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { responsiveFontSize, moderateScale } from '../../../theme/responsive';

export default function RegisterScreen() {
  const { theme } = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ padding: 24, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
      <Text style={{ color: theme.colors.text, textAlign: 'center', fontWeight: '700', fontSize: responsiveFontSize(22), marginTop: 8 }}>Registrate con nosotros</Text>
      <Text style={{ color: theme.colors.text, textAlign: 'center', fontWeight: '700', fontSize: responsiveFontSize(22) }}>para  tener la <Text style={{ color: theme.colors.primary }}>experiencia</Text></Text>
      <Text style={{ color: theme.colors.primary, textAlign: 'center', fontWeight: '700', fontSize: responsiveFontSize(18), marginBottom: 20 }}>completa</Text>

      <Text style={{ color: theme.colors.muted, fontWeight: '700', marginBottom: 6 }}>*Nombre Completo</Text>
      <TextInput placeholder="Nombre y apellidos" placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, padding: moderateScale(12) }]} />

      <Text style={{ color: theme.colors.muted, fontWeight: '700', marginBottom: 6 }}>Correo</Text>
      <TextInput placeholder="correo@correo.com" keyboardType="email-address" placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, padding: moderateScale(12) }]} />

      <Text style={{ color: theme.colors.muted, fontWeight: '700', marginBottom: 6 }}>Ingresa tu contraseña</Text>
      <TextInput placeholder="********" secureTextEntry placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, padding: moderateScale(12) }]} />

      <Text style={{ color: theme.colors.muted, fontWeight: '700', marginBottom: 6 }}>Confirmar contraseña</Text>
      <TextInput placeholder="********" secureTextEntry placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, padding: moderateScale(12), marginBottom: 20 }]} />

      <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.primary, backgroundColor: theme.colors.card }]}> 
        <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Registrarme</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, marginBottom: 12 },
  outlineBtn: { paddingVertical: 14, borderRadius: 999, alignItems: 'center', borderWidth: 1 },
});



