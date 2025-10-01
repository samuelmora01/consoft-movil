import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type OrderCard = {
  id: string;
  number: string;
  name: string;
  status: 'Pendiente' | 'Completado' | 'Cancelado';
  price: string;
  date: string;
  products: number;
  image: string;
};

const SAMPLE_ORDERS: OrderCard[] = [
  { id: '1', number: '001', name: 'Tapicería Personalizada', status: 'Completado', price: '$94.000 COP', date: '4 julio, 2024', products: 3, image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop' },
  { id: '2', number: '002', name: 'Restauración de sillón', status: 'Completado', price: '$160.000 COP', date: '8 julio, 2024', products: 2, image: 'https://images.unsplash.com/photo-1520880867055-1e30d1cb001c?q=80&w=1200&auto=format&fit=crop' },
  { id: '3', number: '003', name: 'Fabricación a medida', status: 'Pendiente', price: '$240.000 COP', date: '12 julio, 2024', products: 4, image: 'https://images.unsplash.com/photo-1538688423619-a81d3f23454b?q=80&w=1200&auto=format&fit=crop' },
];

export default function OrdersScreen({ navigation }: any) {
  const orders = useMemo(() => SAMPLE_ORDERS, []);
  const insets = useSafeAreaInsets();
  const androidTopPad = Platform.OS === 'android' ? Math.max(insets.top, 12) : 0;

  const renderItem = ({ item }: { item: OrderCard }) => {
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetail', { order: item })}>
        <View style={styles.cardTopRow}>
          <Image source={{ uri: item.image }} style={styles.thumb} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>Pedido #{item.number}</Text>
              <View style={styles.badgeRight}>
                <Ionicons name="cube-outline" size={16} color="#6b4028" />
              </View>
            </View>
            <Text numberOfLines={1} style={styles.subtitleSmall}>{item.name}  →</Text>
            <Text style={styles.priceLarge}>{item.price}</Text>
          </View>
        </View>
        <View style={styles.dateBar}>
          <Text numberOfLines={1} style={styles.dateBarText}>Fecha de entrega : {item.date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (orders.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: androidTopPad, alignItems: 'center', justifyContent: 'center' }] }>
        <Ionicons name="bed-outline" size={112} color="#6b7280" />
        <Text style={styles.emptyTitle}>¡Uups!</Text>
        <Text style={styles.emptySubtitle}>Aún no tienes pedidos</Text>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Buscar')}>
          <Text style={styles.ctaText}>Buscar inmuebles</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(o) => o.id}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, paddingTop: 16 + androidTopPad }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 12 },
  emptySubtitle: { color: '#6b7280', marginTop: 8, marginBottom: 16 },
  ctaBtn: { backgroundColor: '#6b4028', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, marginTop: 6 },
  ctaText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 0, borderWidth: 1, borderColor: '#f3e5dc', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 62, height: 62, borderRadius: 12 },
  cardTitle: { fontWeight: '800', color: '#111827' },
  badgeRight: { backgroundColor: '#f3e5dc', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999 },
  subtitleSmall: { color: '#6b7280', marginTop: 6 },
  priceLarge: { color: '#6b4028', fontWeight: '800', fontSize: 18, marginTop: 6 },
  dateBar: { backgroundColor: '#ededed', paddingHorizontal: 12, paddingVertical: 12, marginTop: 10, marginHorizontal: -13, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  dateBarText: { color: '#111827', fontWeight: '600', fontSize: 12 },
});
