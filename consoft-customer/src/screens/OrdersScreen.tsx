import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrdersApi } from '../api/client';
import { API } from '../config';

type OrderCard = {
  id: string;
  number?: string;
  name?: string;
  status?: string;
  price?: string;
  date?: string;
  products?: number;
  image?: string;
};

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<OrderCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const androidTopPad = Platform.OS === 'android' ? Math.max(insets.top, 12) : 0;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!API) throw new Error('Configura API');
        setLoading(true);
        const res = await OrdersApi(API).mine();
        const list = (res as any)?.orders || (Array.isArray(res) ? res : []);
        const mapped: OrderCard[] = list.map((q: any, idx: number) => ({
          id: q._id || q.id || String(idx),
          number: q.code || q._id?.slice(-6),
          name: q.items && q.items[0]?.id_servicio?.name || 'Pedido',
          status: q.status || 'en_proceso',
          price: typeof q.total === 'number' ? `$${q.total.toLocaleString()}` : undefined,
          date: q.deliveryDate ? new Date(q.deliveryDate).toLocaleDateString() : undefined,
          products: Array.isArray(q.items) ? q.items.length : undefined,
          image: undefined,
        }));
        if (mounted) {
          setOrders(mapped);
          setError(null);
        }
      } catch (e) {
        if (mounted) setError((e as Error)?.message || 'No se pudo cargar pedidos');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const renderItem = ({ item }: { item: OrderCard }) => {
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetail', { order: item })}>
        <View style={styles.cardTopRow}>
          {item.image ? <Image source={{ uri: item.image }} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: '#eee' }]} />}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>Pedido {item.number ? `#${item.number}` : ''}</Text>
              <View style={styles.badgeRight}>
                <Ionicons name="cube-outline" size={16} color="#6b4028" />
              </View>
            </View>
            <Text numberOfLines={1} style={styles.subtitleSmall}>{item.name || 'Pedido'}  →</Text>
            {item.price ? <Text style={styles.priceLarge}>{item.price}</Text> : null}
          </View>
        </View>
        <View style={styles.dateBar}>
          <Text numberOfLines={1} style={styles.dateBarText}>Fecha de entrega : {item.date || '—'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: androidTopPad, alignItems: 'center', justifyContent: 'center' }] }>
        <Ionicons name="time-outline" size={64} color="#6b7280" />
        <Text style={styles.emptySubtitle}>Cargando tus pedidos…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: androidTopPad, alignItems: 'center', justifyContent: 'center' }] }>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.emptyTitle}>Error</Text>
        <Text style={styles.emptySubtitle}>{error}</Text>
      </View>
    );
  }

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
