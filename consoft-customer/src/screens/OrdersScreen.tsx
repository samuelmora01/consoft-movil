import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  const renderItem = ({ item }: { item: OrderCard }) => {
    const statusColor = item.status === 'Completado' ? '#16a34a' : item.status === 'Pendiente' ? '#f59e0b' : '#dc2626';
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetail', { order: item })}>
        <Image source={{ uri: item.image }} style={styles.thumb} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.cardTitle}>Pedido #{item.number}</Text>
            <Text style={styles.priceText}>{item.price}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}> 
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.subtitleSmall}>{item.name}</Text>
          <Text style={styles.metaText}>{item.products} productos    {item.date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(o) => o.id}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#f3e5dc' },
  thumb: { width: 70, height: 70, borderRadius: 12 },
  cardTitle: { fontWeight: '800', color: '#111827' },
  priceText: { fontWeight: '800', color: '#111827' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-start', marginTop: 2 },
  statusText: { fontSize: 12, fontWeight: '800' },
  subtitleSmall: { color: '#374151', marginTop: 6 },
  metaText: { color: '#6b7280', fontSize: 12, marginTop: 2 },
});
