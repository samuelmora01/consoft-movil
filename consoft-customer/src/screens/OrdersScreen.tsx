import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrdersApi, QuotationsApi } from '../api/client';
import { API } from '../config';
import { useTheme } from '../theme/theme';

type OrderCard = {
  id: string;
  kind: 'order' | 'quotation';
  number?: string;
  name?: string;
  status?: string;
  total?: number;
  paid?: number;
  remaining?: number;
  percentPaid?: number;
  date?: string;
  daysRemaining?: number;
  products?: number;
  image?: string;
};

export default function OrdersScreen({ navigation }: any) {
  const { theme } = useTheme();
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
        console.log('Fetching orders and quotations...');
        const [ordersRes, quotesRes] = await Promise.allSettled([
          OrdersApi(API).mine(),
          QuotationsApi(API).mine(),
        ]);

        console.log('ordersRes:', ordersRes.status, ordersRes.status === 'rejected' ? ordersRes.reason : 'OK');
        console.log('quotesRes:', quotesRes.status, quotesRes.status === 'rejected' ? quotesRes.reason : 'OK');

        const ordersList: any[] = ordersRes.status === 'fulfilled'
          ? ((ordersRes.value as any)?.orders || (Array.isArray(ordersRes.value) ? ordersRes.value : []))
          : [];
        const quotesList: any[] = quotesRes.status === 'fulfilled'
          ? ((quotesRes.value as any)?.quotations || (quotesRes.value as any)?.items || (Array.isArray(quotesRes.value) ? quotesRes.value : []))
          : [];

        console.log('ordersList length:', ordersList.length);
        console.log('quotesList length:', quotesList.length);
        console.log('quotesList sample:', quotesList.slice(0, 2));

        const mappedOrders: OrderCard[] = ordersList.map((q: any, idx: number) => {
          // Calcular totales
          const total = q.total || (Array.isArray(q.items) ? q.items.reduce((sum: number, it: any) => sum + (Number(it.valor) || 0), 0) : 0);
          const paid = q.paid || (Array.isArray(q.payments) ? q.payments.filter((p: any) => p.status === 'aprobado' || p.status === 'confirmado').reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) : 0) + (q.initialPayment?.amount || 0);
          const remaining = total - paid;
          const percentPaid = total > 0 ? Math.round((paid / total) * 100) : 0;
          
          // Estado inteligente según % pagado
          let status = q.status || 'pendiente';
          if (percentPaid >= 100) status = 'completado';
          else if (percentPaid >= 30) status = 'en_proceso';
          else if (percentPaid > 0) status = 'pendiente_abono';
          else status = 'pendiente';
          
          // Días restantes (15 días desde startedAt o productionStartedAt)
          const startDate = q.productionStartedAt || q.startedAt;
          const daysRemaining = startDate ? Math.max(0, 15 - Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))) : 15;
          
          // Imagen del primer item
          const firstItem = Array.isArray(q.items) && q.items[0];
          const image = firstItem?.imageUrl || firstItem?.id_producto?.featuredImage || firstItem?.id_servicio?.imageUrl || undefined;
          
          return {
            id: q._id || q.id || String(idx),
            kind: 'order',
            number: q.code || q._id?.slice(-6),
            name: firstItem?.detalles || firstItem?.id_producto?.name || firstItem?.id_servicio?.name || 'Pedido',
            status,
            total,
            paid,
            remaining,
            percentPaid,
            date: q.deliveredAt ? new Date(q.deliveredAt).toLocaleDateString() : undefined,
            daysRemaining,
            products: Array.isArray(q.items) ? q.items.length : undefined,
            image,
          };
        });

        const mappedQuotes: OrderCard[] = quotesList
          .filter((qq: any) => {
            const s = String(qq?.status || '').toLowerCase();
            // Mostrar cotizaciones enviadas/pedientes (no carrito)
            return s !== 'carrito' && s !== 'draft';
          })
          .map((qq: any, idx: number) => {
            const items = Array.isArray(qq.items) ? qq.items : [];
            const firstItem = items[0];
            const total = Number(qq.totalEstimate || 0);
            const createdAt = qq.updatedAt || qq.createdAt;
            const date = createdAt ? new Date(createdAt).toLocaleDateString() : undefined;
            const image = firstItem?.product?.imageUrl || firstItem?.customDetails?.referenceImage || undefined;
            const name = firstItem?.product?.name || firstItem?.customDetails?.name || 'Cotización';
            return {
              id: qq._id || qq.id || String(idx),
              kind: 'quotation',
              number: qq.code || qq._id?.slice(-6),
              name,
              status: 'pendiente',
              total,
              paid: 0,
              remaining: total,
              percentPaid: 0,
              date,
              daysRemaining: undefined,
              products: items.length || undefined,
              image,
            };
          });

        const combined: OrderCard[] = [...mappedQuotes, ...mappedOrders].sort((a, b) => {
          const ad = a.date ? new Date(a.date).getTime() : 0;
          const bd = b.date ? new Date(b.date).getTime() : 0;
          return bd - ad;
        });

        if (mounted) {
          console.log('Setting orders:', combined.length, 'items');
          setOrders(combined);
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
    const statusColor = item.status === 'completado' ? '#16a34a' : item.status === 'en_proceso' ? '#3b82f6' : item.status === 'pendiente_abono' ? '#f59e0b' : '#9ca3af';
    const statusLabel = item.status === 'completado' ? 'Completado' : item.status === 'en_proceso' ? 'En proceso' : item.status === 'pendiente_abono' ? 'Abono parcial' : 'Pendiente';
    
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => navigation.navigate('OrderDetail', { order: { ...item, __kind: item.kind } })}
      >
        <View style={styles.cardTopRow}>
          {item.image ? <Image source={{ uri: item.image }} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: theme.colors.border }]} />}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                {item.kind === 'quotation' ? 'Cotización' : 'Pedido'} {item.number ? `#${item.number}` : ''}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>
            <Text numberOfLines={1} style={[styles.subtitleSmall, { color: theme.colors.muted }]}>{item.name || 'Pedido'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
              <Text style={[styles.priceLarge, { color: theme.colors.text }]}>${(item.total || 0).toLocaleString()}</Text>
              {item.percentPaid != null && item.percentPaid > 0 && (
                <View style={[styles.percentBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={[styles.percentText, { color: theme.colors.primary }]}>{item.percentPaid}% pagado</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={[styles.dateBar, { backgroundColor: theme.colors.background }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text numberOfLines={1} style={[styles.dateBarText, { color: theme.colors.muted }]}>Entrega: {item.date || '—'}</Text>
            {item.daysRemaining != null && item.status === 'en_proceso' && (
              <Text style={[styles.daysText, { color: theme.colors.primary }]}>{item.daysRemaining} días restantes</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: androidTopPad, alignItems: 'center', justifyContent: 'center' }] }>
        <Ionicons name="time-outline" size={64} color={theme.colors.muted} />
        <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>Cargando tus pedidos…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: androidTopPad, alignItems: 'center', justifyContent: 'center' }] }>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.danger} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Error</Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>{error}</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: androidTopPad, alignItems: 'center', justifyContent: 'center' }] }>
        <Ionicons name="bed-outline" size={112} color={theme.colors.muted} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>¡Uups!</Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>Aún no tienes pedidos</Text>
        <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate('Buscar')}>
          <Text style={[styles.ctaText, { color: '#fff' }]}>Buscar inmuebles</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      data={orders}
      keyExtractor={(o) => o.id}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, paddingTop: 16 + androidTopPad }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  emptySubtitle: { marginTop: 8, marginBottom: 16 },
  ctaBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, marginTop: 6 },
  ctaText: { fontWeight: '700' },
  card: { borderRadius: 16, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 0, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 62, height: 62, borderRadius: 12 },
  cardTitle: { fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800' },
  subtitleSmall: { marginTop: 4, fontSize: 13 },
  priceLarge: { fontWeight: '800', fontSize: 18 },
  percentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  percentText: { fontSize: 11, fontWeight: '700' },
  dateBar: { paddingHorizontal: 12, paddingVertical: 10, marginTop: 10, marginHorizontal: -13, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  dateBarText: { fontWeight: '600', fontSize: 12 },
  daysText: { fontSize: 12, fontWeight: '700' },
});
