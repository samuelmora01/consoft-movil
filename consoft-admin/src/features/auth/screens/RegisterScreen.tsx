import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/theme';
import { responsiveFontSize, moderateScale } from '../../../theme/responsive';
import { UsersApi, AuthApi } from '../../../api/client';
import { API } from '../../../config';
import { useToast } from '../../../ui/ToastProvider';
import { useAppStore } from '../../../store/appStore';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { show } = useToast();
  const signIn = useAppStore((s) => s.signIn);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const valid = !!name && !!email && password.length >= 6 && password === confirm;

  const onRegister = async () => {
    try {
      if (!API) throw new Error('Configura la URL del backend (API) en app.json');
      if (!valid) throw new Error('Completa los campos y valida la contraseña');
      await UsersApi(API).register(name, email, password);
      await AuthApi(API).login(email, password);
      await AuthApi(API).me();
      signIn(email);
      show('Registro exitoso', 'success');
    } catch (e) {
      const msg = (e as Error)?.message || 'Error al registrarte';
      show(msg, 'error');
    }
  };
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ padding: 24, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
      <Text style={{ color: theme.colors.text, textAlign: 'center', fontWeight: '700', fontSize: responsiveFontSize(22), marginTop: 8 }}>Registrate con nosotros</Text>
      <Text style={{ color: theme.colors.text, textAlign: 'center', fontWeight: '700', fontSize: responsiveFontSize(22) }}>para  tener la <Text style={{ color: theme.colors.primary }}>experiencia</Text></Text>
      <Text style={{ color: theme.colors.primary, textAlign: 'center', fontWeight: '700', fontSize: responsiveFontSize(18), marginBottom: 20 }}>completa</Text>

      <Text style={{ color: theme.colors.muted, fontWeight: '700', marginBottom: 6 }}>*Nombre Completo</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Nombre y apellidos" placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, padding: moderateScale(12) }]} />

      <Text style={{ color: theme.colors.muted, fontWeight: '700', marginBottom: 6 }}>Correo</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="correo@correo.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, padding: moderateScale(12) }]} />

      <Text style={{ color: theme.colors.muted, fontWeight: '700', marginBottom: 6 }}>Ingresa tu contraseña</Text>
      <View style={[styles.rowInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="********"
          secureTextEntry={!showPwd}
          autoCapitalize="none"
          selectTextOnFocus
          contextMenuHidden={false}
          placeholderTextColor={theme.colors.muted}
          style={[styles.rowTextInput, { color: theme.colors.text }]}
        />
        <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={{ paddingHorizontal: 8 }}>
          <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>
      <Text style={{ color: theme.colors.muted, fontSize: 12, marginBottom: 6 }}>Debe incluir 1 mayúscula, 1 número y 1 carácter especial.</Text>

      <Text style={{ color: theme.colors.muted, fontWeight: '700', marginBottom: 6 }}>Confirmar contraseña</Text>
      <View style={[styles.rowInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, marginBottom: 20 }]}>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          placeholder="********"
          secureTextEntry={!showConfirm}
          autoCapitalize="none"
          selectTextOnFocus
          contextMenuHidden={false}
          placeholderTextColor={theme.colors.muted}
          style={[styles.rowTextInput, { color: theme.colors.text }]}
        />
        <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={{ paddingHorizontal: 8 }}>
          <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.primary, backgroundColor: theme.colors.card, opacity: valid ? 1 : 0.6 }]} disabled={!valid} onPress={onRegister}> 
        <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Registrarme</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, marginBottom: 12 },
  rowInput: { borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  rowTextInput: { flex: 1, padding: moderateScale(12) },
  outlineBtn: { paddingVertical: 14, borderRadius: 999, alignItems: 'center', borderWidth: 1 },
});



