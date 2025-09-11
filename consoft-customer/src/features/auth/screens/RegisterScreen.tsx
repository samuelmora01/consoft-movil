import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const BROWN = '#6b4028';
const LIGHT = '#f3ece7';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const valid = name && email && password.length >= 6 && password === confirm;

  const onRegister = () => {
    if (!valid) return;
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Únete para administrar tus pedidos y citas</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Tu nombre" style={styles.input} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Correo</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="correo@correo.com" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Contraseña</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry style={styles.input} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput value={confirm} onChangeText={setConfirm} placeholder="••••••" secureTextEntry style={styles.input} />
      </View>

      <TouchableOpacity style={[styles.button, { opacity: valid ? 1 : 0.5 }]} onPress={onRegister} disabled={!valid}>
        <Text style={styles.buttonText}>Registrarme</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Ya tengo cuenta</Text>
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
  link: { marginTop: 16, textAlign: 'center', color: BROWN, fontWeight: '700' },
});





