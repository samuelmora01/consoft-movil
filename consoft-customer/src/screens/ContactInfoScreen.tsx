import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useUserStore } from '../store/userStore';

export default function ContactInfoScreen({ navigation }: any) {
  const setContact = useUserStore((s) => s.setContact);
  const [backupEmail, setBackupEmail] = useState('');
  const [backupPhone, setBackupPhone] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');

  const save = () => {
    setContact({ backupEmail, backupPhone, defaultAddress });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Información de contacto</Text>
      <Text style={styles.label}>Correo de respaldo</Text>
      <TextInput value={backupEmail} onChangeText={setBackupEmail} placeholder="correo@correo.com" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
      <Text style={styles.label}>Número de celular</Text>
      <TextInput value={backupPhone} onChangeText={setBackupPhone} placeholder="300 000 0000" keyboardType="phone-pad" style={styles.input} />
      <Text style={styles.label}>Dirección predeterminada</Text>
      <TextInput value={defaultAddress} onChangeText={setDefaultAddress} placeholder="Calle 123 #45-67" style={styles.input} />
      <TouchableOpacity style={styles.submit} onPress={save}>
        <Text style={styles.submitText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  label: { fontWeight: '600', color: '#4c3d32', marginBottom: 6, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#e6ded8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  submit: { marginTop: 18, backgroundColor: '#6b4028', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800' },
});


