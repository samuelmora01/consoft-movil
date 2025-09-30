import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useAppStore } from '../../../store/appStore';

export default function EditStatusScreen() {
  const { theme } = useTheme();
  const suspendAccount = useAppStore((s) => s.suspendAccount);
  const closeAccount = useAppStore((s) => s.closeAccount);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <Text style={[styles.title, { color: theme.colors.text }]}>Editar mi Estado</Text>
      <Text style={{ color: theme.colors.muted, marginBottom: 16 }}>Puedes suspender temporalmente tu cuenta o cerrarla de forma permanente.</Text>

      <TouchableOpacity style={[styles.btn, { borderColor: theme.colors.warning, backgroundColor: theme.colors.card }]} onPress={() => { suspendAccount(); Alert.alert('Cuenta suspendida', 'Tu sesión se cerró y tu cuenta quedó en suspensión.'); }}>
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Suspender cuenta</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { borderColor: theme.colors.danger, backgroundColor: theme.colors.card }]} onPress={() => { closeAccount(); Alert.alert('Cuenta cerrada', 'Tu cuenta fue cerrada y la sesión se cerró.'); }}>
        <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>Cerrar cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  btn: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
});




