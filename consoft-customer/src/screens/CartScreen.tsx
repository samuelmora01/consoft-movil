import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { API } from '../config';
import { QuotationsApi } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

// Estructura real del backend según documentación
type CartItem = {
  _id: string;
  product?: { _id?: string; name?: string; imageUrl?: string };
  isCustom?: boolean;
  customDetails?: { name?: string };
  quantity: number;
  color?: string;
  size?: string;
  price: number;
  itemStatus?: string;
};
type Cart = { _id: string; status: string; items: CartItem[]; totalEstimate: number };

export default function CartScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => {
    const items = cart?.items || [];
    return items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  }, [cart]);

  const refresh = useCallback(async () => {
    try {
      if (!API) return;
      setLoading(true);
      const res: any = await QuotationsApi(API).getCart();
      console.log('getCart response:', JSON.stringify(res));
      const c = res?.cart ?? res;
      // Si la respuesta es válida pero no tiene _id, tratar como carrito vacío
      if (!c || !c._id) {
        setCart(null);
        setError(null);
        return;
      }
      setCart(c as Cart);
      setError(null);
    } catch (e: any) {
      console.log('getCart error:', e?.message, 'status:', e?.status);
      // 404 = no hay carrito aún, no es un error real
      if (e?.status === 404 || String(e?.message).includes('404')) {
        setCart(null);
        setError(null);
      } else {
        setError(e?.message || 'No se pudo cargar el carrito');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  async function removeItem(item: CartItem) {
    if (!API || !cart) return;
    try {
      await QuotationsApi(API).removeItem(cart._id, item._id);
      await refresh();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo eliminar el producto');
    }
  }

  async function updateQty(item: CartItem, delta: number) {
    const newQty = item.quantity + delta;
    if (newQty < 1) { removeItem(item); return; }
    if (!API || !cart) return;
    try {
      await QuotationsApi(API).updateItem(cart._id, item._id, { quantity: newQty });
      await refresh();
    } catch {}
  }

  // Flujo según docs: el carrito ya tiene _id, solo llamar submit
  async function submitCart() {
    if (!API || !cart || cart.items.length === 0) return;
    try {
      await QuotationsApi(API).submit(cart._id);
      Alert.alert(
        '✓ Cotización solicitada',
        'Hemos recibido tu solicitud. El equipo te contactará pronto con los precios.',
        [{
          text: 'Ver mis pedidos',
          onPress: () => navigation.navigate('Mis pedidos' as never),
        }],
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo enviar la cotización');
    }
  }

  const itemName = (item: CartItem) =>
    item.isCustom
      ? (item.customDetails?.name || 'Producto personalizado')
      : (item.product?.name || 'Producto');

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      {/* Imagen */}
      {item.product?.imageUrl ? (
        <Image source={{ uri: item.product.imageUrl }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, { backgroundColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name={item.isCustom ? 'build-outline' : 'cube-outline'} size={22} color={theme.colors.muted} />
        </View>
      )}

      {/* Info */}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.itemTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {itemName(item)}
        </Text>

        {/* Color y talla */}
        {(item.color || item.size) ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {item.color ? (
              <Text style={[styles.itemMeta, { color: theme.colors.muted }]}>🎨 {item.color}</Text>
            ) : null}
            {item.size ? (
              <Text style={[styles.itemMeta, { color: theme.colors.muted }]}>📐 {item.size}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Precio por item (0 si aún no cotizado) */}
        {item.price > 0 ? (
          <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
            ${(item.price * item.quantity).toLocaleString()}
          </Text>
        ) : (
          <Text style={[styles.itemMeta, { color: theme.colors.muted, marginTop: 2 }]}>Precio pendiente de cotización</Text>
        )}

        {/* Controles cantidad */}
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={[styles.qtyBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            onPress={() => updateQty(item, -1)}
          >
            <Ionicons name="remove" size={14} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.qtyValue, { color: theme.colors.text }]}>{item.quantity}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            onPress={() => updateQty(item, 1)}
          >
            <Ionicons name="add" size={14} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Eliminar */}
      <TouchableOpacity onPress={() => removeItem(item)} style={styles.removeBtn}>
        <Ionicons name="trash-outline" size={18} color="#dc2626" />
      </TouchableOpacity>
    </View>
  );

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!cart || cart.items.length === 0) return;
    setSubmitting(true);
    try {
      await submitCart();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.muted, marginTop: 12 }}>Cargando carrito…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text style={{ color: theme.colors.muted, marginTop: 8, textAlign: 'center', paddingHorizontal: 24 }}>{error}</Text>
        <TouchableOpacity onPress={refresh} style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = cart?.items || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={renderItem}
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={{ marginBottom: 14 }}>
              <Text style={[styles.screenTitle, { color: theme.colors.text }]}>Tu carrito</Text>
              <Text style={[styles.screenSubtitle, { color: theme.colors.muted }]}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={[styles.emptyBox, { borderColor: theme.colors.border }]}>
            <Ionicons name="cart-outline" size={64} color={theme.colors.muted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Tu carrito está vacío</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>Agrega productos desde el catálogo</Text>
          </View>
        }
      />

      {items.length > 0 && (
        <View style={[styles.footer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
          {total > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.muted }]}>Total estimado</Text>
              <Text style={[styles.totalValue, { color: theme.colors.text }]}>${total.toLocaleString()}</Text>
            </View>
          )}
          <Text style={[styles.footerNote, { color: theme.colors.muted }]}>El equipo cotizará los precios y te notificará.</Text>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: BROWN }, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send-outline" size={18} color="#fff" />}
            <Text style={styles.submitText}>{submitting ? 'Enviando…' : 'Solicitar cotización'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const BROWN = '#6b4028';
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Header lista */
  screenTitle: { fontSize: 22, fontWeight: '800' },
  screenSubtitle: { fontSize: 13, marginTop: 2 },

  /* Tarjeta de ítem */
  itemCard: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 16, padding: 12 },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14 },
  itemMeta: { fontSize: 12 },
  itemPrice: { fontWeight: '800', fontSize: 14 },

  /* Controles cantidad */
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 15, fontWeight: '800', minWidth: 20, textAlign: 'center' },

  removeBtn: { padding: 6, marginLeft: 4 },

  /* Empty */
  emptyBox: { marginTop: 60, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 32, marginHorizontal: 16 },
  emptyTitle: { fontWeight: '800', fontSize: 18, marginTop: 12 },
  emptySubtitle: { fontSize: 14, marginTop: 4, textAlign: 'center' },

  /* Footer */
  footer: { borderTopWidth: 1, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 24 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  totalLabel: { fontSize: 14 },
  totalValue: { fontWeight: '800', fontSize: 20 },
  footerNote: { fontSize: 12, marginBottom: 14 },
  submitBtn: { borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  retryBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
});


