import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useUserStore } from '../store/userStore';
import { useTheme } from '../theme/theme';

export default function ContactInfoScreen({ navigation }: any) {
  const { theme } = useTheme();
  const setContact = useUserStore((s) => s.setContact);
  const [backupEmail, setBackupEmail] = useState('');
  const [backupPhone, setBackupPhone] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');

  const save = () => {
    setContact({ backupEmail, backupPhone, defaultAddress });
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Información de contacto</Text>
      <Text style={[styles.label, { color: theme.colors.muted }]}>Correo de respaldo</Text>
      <TextInput
        value={backupEmail}
        onChangeText={setBackupEmail}
        placeholder="correo@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={theme.colors.muted}
        style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
      />
      <Text style={[styles.label, { color: theme.colors.muted }]}>Número de celular</Text>
      <TextInput
        value={backupPhone}
        onChangeText={setBackupPhone}
        placeholder="300 000 0000"
        keyboardType="phone-pad"
        placeholderTextColor={theme.colors.muted}
        style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
      />
      <Text style={[styles.label, { color: theme.colors.muted }]}>Dirección predeterminada</Text>
      <TextInput
        value={defaultAddress}
        onChangeText={setDefaultAddress}
        placeholder="Calle 123 #45-67"
        placeholderTextColor={theme.colors.muted}
        style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
      />
      <TouchableOpacity style={[styles.submit, { backgroundColor: theme.colors.primary }]} onPress={save}>
        <Text style={styles.submitText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  label: { fontWeight: '600', marginBottom: 6, marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  submit: { marginTop: 18, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800' },
});


