import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/theme';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { theme, toggle } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
        <View style={styles.avatar} />
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.name, { color: theme.colors.text }]}>Samuel Mora</Text>
          <Text style={{ color: theme.colors.muted }}>correo@correo.com</Text>
        </View>
      </View>

      <View style={[styles.list, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
        <TouchableOpacity style={styles.row} onPress={toggle}>
          <View style={styles.rowLeft}>
            <Ionicons name="moon" size={18} color={theme.colors.primary} />
            <Text style={[styles.rowText, { color: theme.colors.text }]}>Modo Oscuro</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('EditProfile')}>
          <View style={styles.rowLeft}>
            <Ionicons name="person-circle-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.rowText, { color: theme.colors.text }]}>Editar mi perfil</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ChangePassword')}>
          <View style={styles.rowLeft}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.rowText, { color: theme.colors.text }]}>Cambiar mi contraseña</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logout} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}>
        <Ionicons name="exit-outline" size={18} color="#ef4444" />
        <Text style={{ color: '#ef4444', fontWeight: '700', marginLeft: 8 }}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#D9D9D9' },
  name: { fontSize: 20, fontWeight: '800' },
  list: { marginTop: 16, borderRadius: 16, borderWidth: 1 },
  row: { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#eee' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { fontWeight: '600' },
  logout: { marginTop: 24, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
});
