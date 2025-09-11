import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const valid = next.length >= 6 && next === confirm && current.length > 0;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cambiar contraseña</Text>
      <TextInput placeholder="Contraseña actual" secureTextEntry style={styles.input} value={current} onChangeText={setCurrent} />
      <TextInput placeholder="Nueva contraseña" secureTextEntry style={styles.input} value={next} onChangeText={setNext} />
      <TextInput placeholder="Confirmar nueva contraseña" secureTextEntry style={styles.input} value={confirm} onChangeText={setConfirm} />
      <TouchableOpacity style={[styles.button, { opacity: valid ? 1 : 0.5 }]} disabled={!valid}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e6ded8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  button: { backgroundColor: '#6b4028', paddingVertical: 12, alignItems: 'center', borderRadius: 12, marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
});





