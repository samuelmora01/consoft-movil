import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function EditStatusScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estado de la cuenta</Text>
      <TouchableOpacity style={[styles.button, { backgroundColor: '#f59e0b' }]} onPress={() => Alert.alert('Cuenta suspendida', 'Tu cuenta ha sido suspendida temporalmente.')}> 
        <Text style={styles.buttonText}>Suspender cuenta</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, { backgroundColor: '#dc2626' }]} onPress={() => Alert.alert('Cuenta cerrada', 'Tu cuenta ha sido cerrada.')}> 
        <Text style={styles.buttonText}>Cerrar cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  button: { paddingVertical: 12, alignItems: 'center', borderRadius: 12, marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
});





