import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthApi } from '../../../api/client';
import { API } from '../../../config';
import { useToast } from '../../../ui/ToastProvider';
import { useTheme } from '../../../theme/theme';

const BROWN = '#6b4028';
const LIGHT = '#f3ece7';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { show } = useToast();
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
        (low.includes('email') && low.includes('no') && low.includes('existe'));
      show(notFound ? 'El correo no está registrado' : raw, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Recuperar contraseña</Text>
      <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Ingresa tu correo para enviarte un enlace de restablecimiento</Text>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.colors.muted }]}>Correo</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="correo@correo.com"
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary, opacity: email && !loading ? 1 : 0.6 }]}
        onPress={onSubmit}
        disabled={!email || loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Enviar enlace'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: 8 },
  field: { marginTop: 18 },
  label: { fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 14, padding: 12 },
  button: { marginTop: 24, padding: 14, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});


