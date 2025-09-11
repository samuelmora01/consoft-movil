import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BROWN = '#6b4028';
const LIGHT = '#f3ece7';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const onLogin = () => {
    const nextErrors: { email?: string; password?: string } = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Correo inválido';
    if (!password || password.length < 6) nextErrors.password = 'Mínimo 6 caracteres';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      navigation.replace('Main');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.topWave} />
      <View style={styles.logoCircle}>
        <Ionicons name="sofa-outline" size={28} color={BROWN} />
      </View>

      <Text style={styles.title}>Bienvenido</Text>
      <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

      <View style={styles.formCard}>
        <View style={styles.field}>
          <Text style={styles.label}>Correo</Text>
          <View style={[styles.inputRow, errors.email && { borderColor: '#ef4444' }]}>
            <Ionicons name="mail-outline" size={18} color="#9b8c7f" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="correo@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.inputFlat}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={[styles.inputRow, errors.password && { borderColor: '#ef4444' }]}>
            <Ionicons name="lock-closed-outline" size={18} color="#9b8c7f" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••"
              secureTextEntry={!showPassword}
              style={styles.inputFlat}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9b8c7f" />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        <TouchableOpacity style={styles.button} onPress={onLogin}>
          <Text style={styles.buttonText}>Ingresar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity>
        <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
        <Text style={{ color: '#6b7280' }}>¿No tienes cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.link, { marginTop: 0 }]}>Regístrate</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff' },
  topWave: { height: 180, backgroundColor: BROWN, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignSelf: 'center', marginTop: -36, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#f6efe9' },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  subtitle: { textAlign: 'center', marginTop: 8, color: '#666' },
  formCard: { marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, borderWidth: 1, borderColor: '#f1e9e3' },
  field: { marginTop: 14 },
  label: { fontWeight: '600', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e6ded8', borderRadius: 14, paddingHorizontal: 12, backgroundColor: LIGHT, height: 48, gap: 8 },
  inputFlat: { flex: 1, color: '#111827' },
  errorText: { color: '#ef4444', marginTop: 6 },
  button: { marginTop: 20, backgroundColor: BROWN, padding: 14, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { marginTop: 16, textAlign: 'center', color: BROWN, fontWeight: '700' },
});
