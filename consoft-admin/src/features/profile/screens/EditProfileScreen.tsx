import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useAppStore } from '../../../store/appStore';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const profile = useAppStore((s) => s.profile)!;
  const updateProfile = useAppStore((s) => s.updateProfile);
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [address, setAddress] = useState(profile.address || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  async function selectPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled && res.assets?.length) {
      setAvatarUrl(res.assets[0].uri);
    }
  }

  function save() {
    updateProfile({ name, email, phone, address, avatarUrl });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.photoRow}>
        <TouchableOpacity onPress={selectPhoto} style={[styles.photoRing, { borderColor: theme.colors.primary }]}> 
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.photo} contentFit="cover" />
          ) : (
            <Text style={{ color: theme.colors.primary }}>Subir foto</Text>
          )}
        </TouchableOpacity>
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Subir foto</Text>
      </View>

      <Text style={[styles.label, { color: theme.colors.text }]}>* Nombre y apellidos</Text>
      <TextInput value={name} onChangeText={setName} style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]} />

      <Text style={[styles.label, { color: theme.colors.text }]}>Correo</Text>
      <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]} />

      <Text style={[styles.label, { color: theme.colors.text }]}>Celular</Text>
      <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]} />

      <Text style={[styles.label, { color: theme.colors.text }]}>Dirección (opcional)</Text>
      <TextInput value={address} onChangeText={setAddress} style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]} />

      <TouchableOpacity onPress={save} style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar Información</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  photoRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  photo: { width: 56, height: 56, borderRadius: 28 },
  label: { fontWeight: '700', marginTop: 8, marginBottom: 6 },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  saveBtn: { marginTop: 28, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
});




