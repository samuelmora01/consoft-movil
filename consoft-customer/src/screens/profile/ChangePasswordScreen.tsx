import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API } from '../../config';
import { AuthApi } from '../../api/client';
import { useTheme } from '../../theme/theme';

export default function ChangePasswordScreen() {
  const { theme } = useTheme();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const valid = next.length >= 6 && next === confirm && current.length > 0;
  async function onSave() {
    if (!valid) return;
    try {
      if (!API) throw new Error('Configura API');
      await AuthApi(API).changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      Alert.alert('✅ Éxito', 'Contraseña actualizada correctamente');
    } catch (e: any) {
      Alert.alert('❌ Error', e.message || 'No se pudo actualizar la contraseña');
    }
  }
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Actualizar contraseña</Text>
      <Text style={[styles.label, { color: theme.colors.text }]}>Contraseña Actual</Text>
      <View style={[styles.inputRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <TextInput 
          placeholder="Ingresa tu contraseña actual" 
          secureTextEntry={!showCurrent} 
          style={[styles.inputFlat, { color: theme.colors.text }]} 
          value={current} 
          onChangeText={setCurrent}
          placeholderTextColor={theme.colors.muted}
        />
        <TouchableOpacity onPress={() => setShowCurrent((v) => !v)}>
          <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.label, { color: theme.colors.text }]}>Nueva Contraseña</Text>
      <View style={[styles.inputRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <TextInput 
          placeholder="Mínimo 6 caracteres" 
          secureTextEntry={!showNext} 
          style={[styles.inputFlat, { color: theme.colors.text }]} 
          value={next} 
          onChangeText={setNext}
          placeholderTextColor={theme.colors.muted}
        />
        <TouchableOpacity onPress={() => setShowNext((v) => !v)}>
          <Ionicons name={showNext ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.label, { color: theme.colors.text }]}>Confirmar nueva contraseña</Text>
      <View style={[styles.inputRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <TextInput 
          placeholder="Repite la nueva contraseña" 
          secureTextEntry={!showConfirm} 
          style={[styles.inputFlat, { color: theme.colors.text }]} 
          value={confirm} 
          onChangeText={setConfirm}
          placeholderTextColor={theme.colors.muted}
        />
        <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
          <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.button, { opacity: valid ? 1 : 0.5 }]} disabled={!valid} onPress={onSave}>
        <Text style={styles.buttonText}>Guardar Información</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label: { fontWeight: '700', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 12 },
  inputFlat: { flex: 1 },
  button: { backgroundColor: '#6b4028', paddingVertical: 14, alignItems: 'center', borderRadius: 16, marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '700' },
});





