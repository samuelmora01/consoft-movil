import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { AuthApi } from '../../../api/client';
import { API } from '../../../config';

export default function ChangePasswordScreen() {
  const { theme } = useTheme();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [show, setShow] = useState({ cur: false, n: false, c: false });
  const [saving, setSaving] = useState(false);

  const canSave = newPwd.length >= 6 && newPwd === confirmPwd && currentPwd.length > 0;

  async function save() {
    if (!canSave || saving) return;
    try {
      setSaving(true);
      if (!API) throw new Error('Configura API');
      await AuthApi(API).changePassword(currentPwd, newPwd);
    Alert.alert('Contraseña actualizada', 'Tu contraseña fue actualizada correctamente.');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (e) {
      Alert.alert('Error', (e as Error)?.message || 'No se pudo actualizar la contraseña');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <Text style={[styles.title, { color: theme.colors.text }]}>Actualizar contraseña</Text>

      <Text style={[styles.label, { color: theme.colors.text }]}>Contraseña Actual</Text>
      <View style={[styles.inputWrap, { backgroundColor: theme.colors.card, borderColor: !currentPwd ? theme.colors.danger : 'transparent', borderWidth: !currentPwd ? 1 : 0 }]}> 
        <TextInput
          value={currentPwd}
          onChangeText={setCurrentPwd}
          placeholder=""
          secureTextEntry={!show.cur}
          style={[styles.input, { color: theme.colors.text }]}
        />
        <TouchableOpacity onPress={() => setShow((s) => ({ ...s, cur: !s.cur }))}>
          <Ionicons name={show.cur ? 'eye-off' : 'eye'} size={18} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: theme.colors.text }]}>Nueva Contraseña</Text>
      <View style={[styles.inputWrap, { backgroundColor: theme.colors.card, borderColor: newPwd.length > 0 && newPwd.length < 6 ? theme.colors.danger : 'transparent', borderWidth: newPwd.length > 0 && newPwd.length < 6 ? 1 : 0 }]}> 
        <TextInput
          value={newPwd}
          onChangeText={setNewPwd}
          placeholder=""
          secureTextEntry={!show.n}
          style={[styles.input, { color: theme.colors.text }]}
        />
        <TouchableOpacity onPress={() => setShow((s) => ({ ...s, n: !s.n }))}>
          <Ionicons name={show.n ? 'eye-off' : 'eye'} size={18} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: theme.colors.text }]}>Confirmar nueva contraseña</Text>
      <View style={[styles.inputWrap, { backgroundColor: theme.colors.card, borderColor: confirmPwd.length > 0 && confirmPwd !== newPwd ? theme.colors.danger : 'transparent', borderWidth: confirmPwd.length > 0 && confirmPwd !== newPwd ? 1 : 0 }]}> 
        <TextInput
          value={confirmPwd}
          onChangeText={setConfirmPwd}
          placeholder=""
          secureTextEntry={!show.c}
          style={[styles.input, { color: theme.colors.text }]}
        />
        <TouchableOpacity onPress={() => setShow((s) => ({ ...s, c: !s.c }))}>
          <Ionicons name={show.c ? 'eye-off' : 'eye'} size={18} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity disabled={!canSave || saving} onPress={save} style={[styles.saveBtn, { backgroundColor: canSave ? theme.colors.primary : theme.colors.muted, opacity: saving ? 0.7 : 1 }]}> 
        <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar Información</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', marginTop: 8, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  input: { flex: 1 },
  saveBtn: { marginTop: 28, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
});


