import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UsersApi, AuthApi } from '../../../api/client';
import { API } from '../../../config';
import { useToast } from '../../../ui/ToastProvider';

const BROWN = '#6b4028';
const LIGHT = '#f3ece7';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const valid = name && email && password.length >= 6 && password === confirm;
  const { show } = useToast();

  const onRegister = async () => {
    try {
      if (!API) throw new Error('Configura la URL del backend (API) en app.json');
      if (!valid) throw new Error('Completa los campos y valida la contraseña');
      await UsersApi(API).register(name, email, password);
      await AuthApi(API).login(email, password);
      await AuthApi(API).me();
      show('Registro exitoso', 'success');
      navigation.replace('Main');
    } catch (e) {
      const msg = (e as Error)?.message || 'Error al registrarte';
      show(msg, 'error');
    }
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
        <View style={[styles.inputRow]}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••"
            secureTextEntry={!showPwd}
            autoCapitalize="none"
            selectTextOnFocus
            contextMenuHidden={false}
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
          />
          <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={{ paddingHorizontal: 8 }}>
            <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6b4028" />
          </TouchableOpacity>
        </View>
        <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>
          Debe incluir al menos 1 mayúscula, 1 número y 1 caracter especial.
        </Text>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Confirmar contraseña</Text>
        <View style={[styles.inputRow]}>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="••••••"
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            selectTextOnFocus
            contextMenuHidden={false}
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
          />
          <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={{ paddingHorizontal: 8 }}>
            <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6b4028" />
          </TouchableOpacity>
        </View>
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
  input: { borderWidth: 1, borderColor: '#e6ded8', borderRadius: 14, padding: 12, backgroundColor: LIGHT, marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e6ded8', borderRadius: 14, paddingRight: 8, backgroundColor: LIGHT },
  button: { marginTop: 24, backgroundColor: BROWN, padding: 14, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { marginTop: 16, textAlign: 'center', color: BROWN, fontWeight: '700' },
});





