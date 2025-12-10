import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthApi } from '../../../api/client';
import { API } from '../../../config';
import { useToast } from '../../../ui/ToastProvider';

const BROWN = '#6b4028';
const LIGHT = '#f3ece7';

export default function ForgotPasswordScreen({ navigation }: any) {
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
      const msg = (e as Error)?.message || 'No pudimos enviar el correo';
      show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.subtitle}>Ingresa tu correo para enviarte un enlace de restablecimiento</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Correo</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="correo@correo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
      </View>

      <TouchableOpacity style={[styles.button, { opacity: email && !loading ? 1 : 0.6 }]} onPress={onSubmit} disabled={!email || loading}>
        <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Enviar enlace'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: 8, color: '#666' },
  field: { marginTop: 18 },
  label: { fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e6ded8', borderRadius: 14, padding: 12, backgroundColor: LIGHT },
  button: { marginTop: 24, backgroundColor: BROWN, padding: 14, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});


