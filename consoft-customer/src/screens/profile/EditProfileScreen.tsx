import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { API } from '../../config';
import { AuthApi, UsersApi } from '../../api/client';
import { useTheme } from '../../theme/theme';

export default function EditProfileScreen() {
  const { theme } = useTheme();
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
        // Usar UsersApi.me() que ya tiene los fallbacks correctos
        const me: any = await UsersApi(API).me();
        const u: any = (me && (me.user || me)) || {};
        setName(u?.name || u?.fullName || '');
        setEmail(u?.email || '');
        setPhone(u?.phone || '');
        setAddress(u?.address || '');
        setAvatarUrl(u?.avatarUrl || u?.profile_picture || u?.photoUrl);
      } catch (error) {
        // Silently handle error
      }
    })();
  }, []);
  async function pickPhoto() {
    const mediaType: any =
      (ImagePicker as any).MediaType?.Images ??
      (ImagePicker as any).MediaTypeOptions?.Images;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: mediaType, quality: 0.7 });
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
      const beforeUser: any = (freshBefore && (freshBefore.user || freshBefore)) || {};
      const changed: any = {};
      if (name !== (beforeUser?.name || beforeUser?.fullName || '')) changed.name = name;
      if (email !== (beforeUser?.email || '')) changed.email = email;
      if (phone !== (beforeUser?.phone || beforeUser?.phoneNumber || beforeUser?.celular || '')) changed.phone = phone;
      if (address !== (beforeUser?.address || beforeUser?.direccion || '')) changed.address = address;

      // Solo usar multipart cuando realmente se está subiendo una imagen local.
      const profilePictureUri = avatarUrl && !/^https?:\/\//i.test(avatarUrl) ? avatarUrl : undefined;
      if (profilePictureUri) {
        try {
          await UsersApi(API).updateMeMultipart({ ...changed, profilePictureUri });
        } catch {
          // Fallback: si el endpoint multipart no guarda bien los campos, al menos persistir texto.
          if (Object.keys(changed).length) {
            await UsersApi(API).updateMe(changed);
          }
        }
      } else {
        if (Object.keys(changed).length) {
          await UsersApi(API).updateMe(changed);
        }
      }
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
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={pickPhoto}
          style={[styles.photoCircle, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}
        >
          {avatarUrl ? (
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Cambiar foto</Text>
          ) : (
            <Ionicons name="image-outline" size={28} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
        <Text style={[styles.uploadText, { color: theme.colors.primary }]}>{avatarUrl ? 'Foto seleccionada' : 'Subir foto'}</Text>
      </View>

      <Text style={[styles.label, { color: theme.colors.text }]}>* Nombre y apellidos</Text>
      <TextInput placeholder="" style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, color: theme.colors.text }]} value={name} onChangeText={setName} placeholderTextColor={theme.colors.muted} />

      <Text style={[styles.label, { color: theme.colors.text }]}>Correo</Text>
      <TextInput placeholder="" style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, color: theme.colors.text }]} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={theme.colors.muted} />

      <Text style={[styles.label, { color: theme.colors.text }]}>Celular</Text>
      <TextInput placeholder="" style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, color: theme.colors.text }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={theme.colors.muted} />

      <Text style={[styles.label, { color: theme.colors.text }]}>Dirección (opcional)</Text>
      <TextInput placeholder="" style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, color: theme.colors.text }]} value={address} onChangeText={setAddress} placeholderTextColor={theme.colors.muted} />

      <TouchableOpacity style={[styles.button, { opacity: saving ? 0.6 : 1, backgroundColor: theme.colors.primary }]} disabled={saving} onPress={save}><Text style={styles.buttonText}>Guardar Información</Text></TouchableOpacity>
    </ScrollView>
  );
}

const BROWN = '#6b4028';

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  photoCircle: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  uploadText: { fontWeight: '700' },
  label: { fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 12 },
  button: { backgroundColor: BROWN, paddingVertical: 14, alignItems: 'center', borderRadius: 16, marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '700' },
});





