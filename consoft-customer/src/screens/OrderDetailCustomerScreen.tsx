import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OrderDetailCustomerScreen({ route, navigation }: any) {
  const { order } = route.params || {};
  const status = order?.status ?? 'Pendiente';
  const statusColor = status === 'Completado' ? '#16a34a' : status === 'Pendiente' ? '#f59e0b' : '#dc2626';
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Image source={{ uri: order?.image }} style={styles.thumb} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.title}>Pedido #{order?.number ?? '—'}</Text>
          <Text style={styles.subtitle}>{order?.name ?? ''}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}> 
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>

      {/* Three slots */}
      <View style={styles.slotsRow}>
        {[0,1,2].map((i) => (
          <View key={i} style={styles.slotBox}>
            <Ionicons name="cube-outline" size={22} color="#b45309" />
            <Text style={styles.slotText}>aun no{"\n"}terminado</Text>
          </View>
        ))}
      </View>
      <View style={styles.slotLabels}>
        {[0,1,2].map((i) => (
          <Text key={i} style={styles.slotLabel}>Silla Reclinable</Text>
        ))}
      </View>

      {/* Divider title */}
      <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
        <View style={styles.divider} />
        <Text style={styles.detailsTitle}>Detalles</Text>
        <View style={styles.divider} />
      </View>

      {/* Two-column details */}
      <View style={styles.twoColRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.muted}>fecha de entrega</Text>
          <Text style={styles.value}>{order?.date ?? '—'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.muted, { textAlign: 'right' }]}>Estado</Text>
          <Text style={[styles.value, { textAlign: 'right' }]}>{status}</Text>
        </View>
      </View>

      <View style={styles.twoColRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.muted}>Precio acordado</Text>
          <Text style={styles.value}>{order?.price ?? '—'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.muted, { textAlign: 'right' }]}>Valor Restante</Text>
          <Text style={[styles.value, { textAlign: 'right' }]}>$ 20.000 COP</Text>
        </View>
      </View>

      {/* Extra info to fill space elegantly */}
      <View style={styles.infoRow}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Método de pago</Text>
          <Text style={styles.infoValue}>Transferencia</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Contacto</Text>
          <Text style={styles.infoValue}>soporte@consoft.com</Text>
        </View>
      </View>
      <Text style={[styles.muted, { marginTop: 12 }]}>Nota</Text>
      <Text style={{ color: '#374151', lineHeight: 18 }}>Te notificaremos cuando tu pago sea validado y el pedido cambie de estado.</Text>

      {/* CTA */}
      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('OrderPayment', { order })}>
        <Text style={styles.primaryBtnText}>Siguiente</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  title: { fontWeight: '800', fontSize: 16, color: '#111827' },
  subtitle: { color: '#6b7280' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '800' },
  slotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  slotBox: { width: '31%', height: 96, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#d6ccc3', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff7ed' },
  slotText: { color: '#92400e', textAlign: 'center', fontSize: 10, marginTop: 4 },
  slotLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  slotLabel: { flex: 1, textAlign: 'center', color: '#6b7280', fontSize: 12 },
  divider: { width: 160, height: 3, backgroundColor: '#111827', borderRadius: 2 },
  detailsTitle: { fontWeight: '700', fontSize: 18, marginVertical: 8, color: '#111827' },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  muted: { color: '#9ca3af', fontSize: 12 },
  value: { color: '#111827', fontWeight: '800' },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  infoBox: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6ded8', borderRadius: 12, padding: 12 },
  infoTitle: { color: '#9ca3af', fontSize: 12 },
  infoValue: { color: '#111827', fontWeight: '700', marginTop: 4 },
  primaryBtn: { marginTop: 26, backgroundColor: '#6b4028', borderRadius: 14, alignItems: 'center', paddingVertical: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
});


