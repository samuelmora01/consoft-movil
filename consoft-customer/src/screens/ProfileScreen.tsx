import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/theme';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { theme, toggle } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.card, { backgroundColor: theme.colors.background }]}> 
        <View style={styles.avatarRing}>
          <View style={styles.avatarRingInner}>
            <Image source={{ uri: 'https://i.pravatar.cc/120?img=5' }} style={styles.avatarImg} />
          </View>
        </View>
        <View style={{ marginLeft: 14 }}>
          <Text style={[styles.name, { color: theme.colors.text }]}>Samuel Mora</Text>
          <Text style={{ color: theme.colors.muted }}>correo@correo.com</Text>
        </View>
      </View>

      <View style={[styles.list, { backgroundColor: theme.colors.background }]}> 
        <TouchableOpacity style={styles.row} onPress={toggle}>
          <View style={styles.rowLeft}>
            <View style={styles.iconCircle}><Ionicons name="moon" size={18} color={theme.colors.muted} /></View>
            <Text style={[styles.rowText, { color: theme.colors.text }]}>Modo Oscuro</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('EditProfile')}>
          <View style={styles.rowLeft}>
            <View style={styles.iconCircle}><Ionicons name="person-circle-outline" size={18} color={theme.colors.muted} /></View>
            <Text style={[styles.rowText, { color: theme.colors.text }]}>Editar mi perfil</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ChangePassword')}>
          <View style={styles.rowLeft}>
            <View style={styles.iconCircle}><Ionicons name="lock-closed-outline" size={18} color={theme.colors.muted} /></View>
            <Text style={[styles.rowText, { color: theme.colors.text }]}>Cambiar mi contraseña</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.logout} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}>
        <View style={styles.exitCircle}><Ionicons name="exit-outline" size={18} color="#DC2626" /></View>
        <Text style={{ color: '#DC2626', fontWeight: '700', marginLeft: 8 }}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  avatarRing: { width: 92, height: 92, borderRadius: 46, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  avatarRingInner: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 76, height: 76, borderRadius: 38 },
  name: { fontSize: 24, fontWeight: '800' },
  list: { marginTop: 20 },
  row: { paddingVertical: 18, paddingHorizontal: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { fontWeight: '600', fontSize: 16 },
  logout: { marginTop: 28, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4EFFF', borderWidth: 1, borderColor: '#E9D5FF', alignItems: 'center', justifyContent: 'center' },
  exitCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5', alignItems: 'center', justifyContent: 'center' },
});
