import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar perfil</Text>
      <TextInput placeholder="Nombre" style={styles.input} value={name} onChangeText={setName} />
      <TextInput placeholder="Correo" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput placeholder="Celular" style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput placeholder="Dirección" style={styles.input} value={address} onChangeText={setAddress} />
      <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Guardar</Text></TouchableOpacity>
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





