import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReviewsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reseñas (Customer)</Text>
      <Text style={styles.subtitle}>Reseñas visibles para el cliente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { marginTop: 8, color: '#666' },
});
