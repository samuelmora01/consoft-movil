import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const valid = next.length >= 6 && next === confirm && current.length > 0;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Actualizar contraseña</Text>
      <Text style={styles.label}>Contraseña Actual</Text>
      <View style={styles.inputRow}>
        <TextInput placeholder="" secureTextEntry={!showCurrent} style={styles.inputFlat} value={current} onChangeText={setCurrent} />
        <TouchableOpacity onPress={() => setShowCurrent((v) => !v)}>
          <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={18} color="#0f172a" />
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Nueva Contraseña</Text>
      <View style={styles.inputRow}>
        <TextInput placeholder="" secureTextEntry={!showNext} style={styles.inputFlat} value={next} onChangeText={setNext} />
        <TouchableOpacity onPress={() => setShowNext((v) => !v)}>
          <Ionicons name={showNext ? 'eye-off-outline' : 'eye-outline'} size={18} color="#0f172a" />
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Confirmar nueva contraseña</Text>
      <View style={styles.inputRow}>
        <TextInput placeholder="" secureTextEntry={!showConfirm} style={styles.inputFlat} value={confirm} onChangeText={setConfirm} />
        <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
          <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#0f172a" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.button, { opacity: valid ? 1 : 0.5 }]} disabled={!valid}>
        <Text style={styles.buttonText}>Guardar Información</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label: { fontWeight: '700', marginBottom: 8, color: '#0f172a' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#EEF0F5', borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 12 },
  inputFlat: { flex: 1 },
  button: { backgroundColor: '#6b4028', paddingVertical: 14, alignItems: 'center', borderRadius: 16, marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '700' },
});





