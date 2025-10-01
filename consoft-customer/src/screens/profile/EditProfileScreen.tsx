import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <View style={styles.photoCircle}>
          <Ionicons name="image-outline" size={28} color={BROWN} />
        </View>
        <Text style={styles.uploadText}>Subir foto</Text>
      </View>

      <Text style={styles.label}>* Nombre y apellidos</Text>
      <TextInput placeholder="" style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Correo</Text>
      <TextInput placeholder="" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

      <Text style={styles.label}>Celular</Text>
      <TextInput placeholder="" style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>Dirección (opcional)</Text>
      <TextInput placeholder="" style={styles.input} value={address} onChangeText={setAddress} />

      <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Guardar Información</Text></TouchableOpacity>
    </ScrollView>
  );
}

const BROWN = '#6b4028';

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  photoCircle: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: BROWN, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  uploadText: { color: BROWN, fontWeight: '700' },
  label: { fontWeight: '700', marginBottom: 8, color: '#0f172a' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#EEF0F5', borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 12 },
  button: { backgroundColor: BROWN, paddingVertical: 14, alignItems: 'center', borderRadius: 16, marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '700' },
});





