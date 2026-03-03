import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { responsiveFontSize, moderateScale } from '../../../theme/responsive';
import { AuthApi } from '../../../api/client';
import { API } from '../../../config';
import { useToast } from '../../../ui/ToastProvider';
import { useNavigation } from '@react-navigation/native';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const { show } = useToast();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email) return;
    try {
      if (!API) throw new Error('Configura la URL del backend (API) en app.json');
      setLoading(true);
      await AuthApi(API).forgotPassword(email);
      show('Te enviamos un correo con instrucciones', 'success');
      navigation.goBack();
    } catch (e) {
      const raw = (e as Error)?.message || 'No pudimos enviar el correo';
      const low = raw.toLowerCase();
      const notFound =
        low.includes('404') ||
        low.includes('no registrado') ||
        low.includes('not found') ||
        low.includes('usuario no existe') ||
        low.includes('email') && low.includes('no') && low.includes('existe');
      show(notFound ? 'El correo no está registrado' : raw, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Recuperar contraseña</Text>
      <Text style={{ color: theme.colors.muted, marginBottom: 16, textAlign: 'center' }}>
        Ingresa tu correo y te enviaremos un enlace para restablecerla.
      </Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="correo@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={theme.colors.muted}
        style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, padding: moderateScale(12) }]}
      />
      <TouchableOpacity
        onPress={onSubmit}
        disabled={!email || loading}
        style={[styles.primaryBtn, { backgroundColor: theme.colors.primary, opacity: !email || loading ? 0.6 : 1 }]}
      >
        <Text style={styles.primaryText}>{loading ? 'Enviando...' : 'Enviar enlace'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: responsiveFontSize(22), fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 12, marginBottom: 16 },
  primaryBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '700' },
});


