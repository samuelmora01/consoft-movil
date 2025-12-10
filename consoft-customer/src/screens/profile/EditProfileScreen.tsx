import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { API } from '../../config';
import { AuthApi, UsersApi } from '../../api/client';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        if (!API) return;
        const me = await AuthApi(API).me();
        setName(me?.name || '');
        setEmail(me?.email || '');
        setPhone(me?.phone || '');
        setAddress(me?.address || '');
        setAvatarUrl(me?.avatarUrl);
      } catch {}
    })();
  }, []);
  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled && res.assets?.length) {
      const asset = res.assets[0];
      let localUri = asset.uri;
      const fallbackExt = (asset.fileName && asset.fileName.split('.').pop()) || 'jpg';
      if (!localUri.startsWith('file://')) {
        try {
          const dest = `${FileSystem.cacheDirectory}profile-${Date.now()}.${fallbackExt}`;
          await FileSystem.copyAsync({ from: localUri, to: dest });
          localUri = dest;
        } catch {
          // ignore
        }
      }
      setAvatarUrl(localUri);
    }
  }
  async function save() {
    try {
      setSaving(true);
      if (!API) throw new Error('Configura API');
      // Solo enviar campos que cambian; primero leer actual
      let freshBefore: any = {};
      try { freshBefore = await UsersApi(API).me(); } catch {}
      const changed: any = {};
      if (name !== (freshBefore?.name || '')) changed.name = name;
      if (email !== (freshBefore?.email || '')) changed.email = email;
      if (phone !== (freshBefore?.phone || '')) changed.phone = phone;
      if (address !== (freshBefore?.address || '')) changed.address = address;
      const profilePictureUri = avatarUrl && !/^https?:\/\//i.test(avatarUrl) ? avatarUrl : undefined;
      await UsersApi(API).updateMeMultipart({ ...changed, profilePictureUri });
      try {
        const fresh = await UsersApi(API).me();
        const u: any = (fresh as any)?.user || fresh;
        setName(u?.name || u?.fullName || u?.email || '');
        setEmail(u?.email || '');
        setPhone(u?.phone || '');
        setAddress(u?.address || '');
        if (u?.avatarUrl || u?.profile_picture || u?.photoUrl) {
          setAvatarUrl(u?.avatarUrl || u?.profile_picture || u?.photoUrl);
        }
      } catch {}
      Alert.alert('Éxito', 'Tu información fue guardada correctamente.');
    } catch (e) {
      Alert.alert('Error', (e as Error)?.message || 'No se pudo guardar la información');
    } finally {
      setSaving(false);
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={pickPhoto} style={styles.photoCircle}>
          {avatarUrl ? <Text style={{ color: BROWN, fontWeight: '700' }}>Cambiar foto</Text> : <Ionicons name="image-outline" size={28} color={BROWN} />}
        </TouchableOpacity>
        <Text style={styles.uploadText}>{avatarUrl ? 'Foto seleccionada' : 'Subir foto'}</Text>
      </View>

      <Text style={styles.label}>* Nombre y apellidos</Text>
      <TextInput placeholder="" style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Correo</Text>
      <TextInput placeholder="" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

      <Text style={styles.label}>Celular</Text>
      <TextInput placeholder="" style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>Dirección (opcional)</Text>
      <TextInput placeholder="" style={styles.input} value={address} onChangeText={setAddress} />

      <TouchableOpacity style={[styles.button, { opacity: saving ? 0.6 : 1 }]} disabled={saving} onPress={save}><Text style={styles.buttonText}>Guardar Información</Text></TouchableOpacity>
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





