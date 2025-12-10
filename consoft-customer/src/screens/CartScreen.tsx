import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { API } from '../config';
import { QuotationsApi } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';

type CartItem = { _id: string; id: string; productId?: any; name?: string; quantity?: number; price?: number; image?: string };
type Cart = { _id: string; id: string; items: CartItem[] };

export default function CartScreen({ navigation }: any) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => {
    const items = cart?.items || [];
    return items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  }, [cart]);

  async function refresh() {
    try {
      if (!API) return;
      setLoading(true);
      const res = await QuotationsApi(API).getCart();
      const c: any = (res as any).cart || res;
      const items = (c?.items || []).map((it: any) => ({
        _id: it._id || it.id,
        id: it._id || it.id,
        productId: it.productId || it.product || it.pid,
        name: it.name || it.title || it.product?.name,
        quantity: it.quantity || 1,
        price: it.price || it.product?.price || 0,
        image: it.image || it.product?.featuredImage || (Array.isArray(it.product?.images) ? it.product.images[0] : undefined),
      }));
      setCart({ _id: c?._id || c?.id, id: c?._id || c?.id, items });
      setError(null);
    } catch (e) {
      setError((e as Error)?.message || 'No se pudo cargar el carrito');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function removeItem(item: CartItem) {
    try {
      if (!API || !cart) return;
      await QuotationsApi(API).removeItem(cart.id, item._id);
      await refresh();
    } catch {}
  }

  async function quickQuoteItem(item: CartItem) {
    try {
      if (!API) return;
      const pid = (item.productId && (item.productId._id || item.productId.id)) || item.productId || item.id;
      if (!pid) return;
      await QuotationsApi(API).quick(String(pid), { quantity: item.quantity || 1 });
      // Ir a chat
      navigation.navigate('Perfil', { screen: 'ChatRoot' } as any);
    } catch {}
  }

  async function submitCart() {
    try {
      if (!API || !cart) return;
      await QuotationsApi(API).submit(cart.id);
      // Enviar primer mensaje al chat con resumen
      try {
        const socket = io(API, { withCredentials: true, transports: ['websocket'] });
        socket.emit('order:join', { orderId: cart.id });
        socket.emit('quotation:join', { quotationId: cart.id });
        const list = cart.items || [];
        const summary = list.slice(0, 3).map((i) => i.name).join(', ');
        const totalText = total ? `Total: $${total.toLocaleString()}` : '';
        const msg = `Hola, acabo de enviar mi cotización.${summary ? ` Items: ${summary}${list.length > 3 ? '…' : ''}.` : ''} ${totalText}`;
        socket.emit('chat:message', { orderId: cart.id, quotationId: cart.id, message: msg });
        setTimeout(() => socket.disconnect(), 500);
      } catch {}
      // Abrir chat
      navigation.navigate('Perfil' as never, { screen: 'ChatRoom', params: { id: cart.id, title: 'Chat' } } as never);
    } catch {}
  }

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemCard}>
      {item.image ? <Image source={{ uri: item.image }} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: '#eee' }]} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.name || 'Producto'}</Text>
        <Text style={styles.itemPrice}>{typeof item.price === 'number' ? `$${item.price.toLocaleString()}` : ''}</Text>
      </View>
      <TouchableOpacity onPress={() => quickQuoteItem(item)} style={styles.quickBtn}>
        <Ionicons name="pricetag-outline" size={18} color="#6b4028" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeItem(item)} style={styles.removeBtn}>
        <Ionicons name="trash-outline" size={18} color="#dc2626" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <View style={[styles.container, styles.center]}><Text style={{ color: '#6b7280' }}>Cargando carrito…</Text></View>;
  }
  if (error) {
    return <View style={[styles.container, styles.center]}><Text style={{ color: '#dc2626' }}>{error}</Text></View>;
  }
  return (
    <View style={styles.container}>
      <FlatList
        data={cart?.items || []}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={renderItem}
        ListEmptyComponent={<View style={[styles.center, { padding: 24 }]}><Text style={{ color: '#6b7280' }}>Tu carrito está vacío</Text></View>}
      />
      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: ${total.toLocaleString()}</Text>
        <TouchableOpacity style={styles.submitBtn} onPress={submitCart} disabled={!cart || (cart.items || []).length === 0}>
          <Text style={styles.submitText}>Enviar cotización</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BROWN = '#6b4028';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { alignItems: 'center', justifyContent: 'center' },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 10 },
  thumb: { width: 52, height: 52, borderRadius: 10, marginRight: 10 },
  itemTitle: { fontWeight: '700', color: '#111827' },
  itemPrice: { color: '#6b7280', marginTop: 2 },
  removeBtn: { padding: 8 },
  quickBtn: { padding: 8 },
  footer: { borderTopWidth: 1, borderTopColor: '#E5E7EB', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalText: { fontWeight: '800', color: '#111827' },
  submitBtn: { backgroundColor: BROWN, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  submitText: { color: '#fff', fontWeight: '800' },
});


