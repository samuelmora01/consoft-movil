import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { theme, toggleMode } = useTheme();
  const navigation = useNavigation<any>();
  const isDark = theme.mode === 'dark';
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      {/* Header avatar/name */}
      <View style={[styles.headerRow]}>
        <View style={[styles.avatarRing, { borderColor: theme.colors.border }]}> 
          <Image
            source={{ uri: 'https://i.pravatar.cc/120?img=5' }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
        <View>
          <Text style={[styles.name, { color: theme.colors.text }]}>Samuel Mora</Text>
          <Text style={{ color: theme.colors.muted }}>correo@correo.com</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.section}> 
        <View style={styles.itemRow}>
          <View style={[styles.iconWrap, { backgroundColor: '#EEE9F8', borderColor: '#E6E0F2' }]}> 
            <Ionicons name="moon" size={18} color={theme.colors.text} />
          </View>
          <Text style={[styles.itemText, { color: theme.colors.text, flex: 1 }]}>Modo Oscuro</Text>
          <Switch value={isDark} onValueChange={toggleMode} />
        </View>
        <TouchableOpacity style={styles.itemRow} onPress={() => navigation.navigate('EditProfile') }>
          <View style={[styles.iconWrap, { backgroundColor: '#EEE9F8', borderColor: '#E6E0F2' }]}> 
            <Ionicons name="person" size={18} color={theme.colors.text} />
          </View>
          <Text style={[styles.itemText, { color: theme.colors.text, flex: 1 }]}>Editar mi perfil</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.itemRow} onPress={() => navigation.navigate('ChangePassword') }>
          <View style={[styles.iconWrap, { backgroundColor: '#EEE9F8', borderColor: '#E6E0F2' }]}> 
            <Ionicons name="lock-closed" size={18} color={theme.colors.text} />
          </View>
          <Text style={[styles.itemText, { color: theme.colors.text, flex: 1 }]}>Cambiar mi contraseña</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.itemRow} onPress={() => navigation.navigate('EditStatus') }>
          <View style={[styles.iconWrap, { backgroundColor: '#EEE9F8', borderColor: '#E6E0F2' }]}> 
            <Ionicons name="shield-checkmark" size={18} color={theme.colors.text} />
          </View>
          <Text style={[styles.itemText, { color: theme.colors.text, flex: 1 }]}>Editar mi Estado</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.logoutRow]} onPress={() => {/* Simple logout to login */ (require('../../../store/appStore') as any).useAppStore.getState().signOut(); }}>
        <View style={[styles.iconWrap, { backgroundColor: '#FDECEC' }]}>
          <Ionicons name="log-out" size={18} color={theme.colors.danger} />
        </View>
        <Text style={[styles.logoutText, { color: theme.colors.danger }]}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatarRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 10 },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  name: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  section: { paddingHorizontal: 4, paddingVertical: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginBottom: 6 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1 },
  label: { fontWeight: '700' },
  itemText: { fontSize: 16 },
  logoutRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  logoutText: { fontSize: 16, fontWeight: '700' },
  // removed modal styles
});



