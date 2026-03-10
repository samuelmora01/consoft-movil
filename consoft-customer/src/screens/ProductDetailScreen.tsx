import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API } from '../config';
import { QuotationsApi } from '../api/client';
import { useTheme } from '../theme/theme';

const BROWN = '#6b4028';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { item } = route.params || {};
  const { theme } = useTheme();

  // Según la documentación: producto tiene _id, name, description, descriptionC, imageUrl
  const productId: string = String(item?._id || item?.id || route.params?.id || '');
  const imageUrl: string = item?.imageUrl || item?.image || item?.featuredImage || '';
  const productName: string = item?.name || item?.title || 'Producto';
  const descriptionText: string = item?.description || item?.descripcion || item?.descriptionC || '';
  const categoryName: string = item?.category?.name || item?.categoryName || '';

  // Debug para ver qué datos llegan
  console.log('[ProductDetailScreen] Item data:', item);
  console.log('[ProductDetailScreen] Image URL:', imageUrl);

  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);

  function formatErr(e: unknown): string {
    const err: any = e;
    const status = err?.status ? ` (HTTP ${err.status})` : '';
    return `${err?.message || 'Error inesperado'}${status}`;
  }

  // Añadir al carrito: POST /api/quotations/cart con productId, quantity, color, size
  async function addToCart() {
    if (!productId) { Alert.alert('Error', 'Producto sin ID'); return; }
    if (!API) { Alert.alert('Error', 'Configura la URL del backend'); return; }

    setLoadingCart(true);
    try {
      await QuotationsApi(API).addItemToCart({
        productId,
        quantity,
        color: color.trim() || 'Sin color', // Backend exige color obligatorio
        size: size.trim() || '', // Size opcional
      });
      Alert.alert('✓ Añadido al carrito', `${quantity} × ${productName}`, [
        { text: 'Ver carrito', onPress: () => navigation.navigate('CartHome') },
        { text: 'Seguir viendo', style: 'cancel' },
      ]);
    } catch (e) {
      Alert.alert('Error al añadir', formatErr(e));
    } finally {
      setLoadingCart(false);
    }
  }

  // Solicitar cotización:
  // Intentar quick (solo este producto). Si falla (500), hacer fallback al flujo del carrito.
  async function requestQuote() {
    if (!productId) { Alert.alert('Error', 'Producto sin ID'); return; }
    if (!API) { Alert.alert('Error', 'Configura la URL del backend'); return; }
    setLoadingQuote(true);
    let usedFallback = false;
    try {
      // 1) Intentar quick (cotización independiente)
      const res: any = await QuotationsApi(API).quick([
        {
          productId,
          quantity,
          color: color.trim() || undefined,
          size: size.trim() || undefined,
        },
      ]);
      console.log('quick quotation response:', JSON.stringify(res));

      const quotationId: string | undefined = res?.quotation?._id || res?.quotation?.id || res?._id || res?.id;
      Alert.alert(
        '✓ Cotización solicitada',
        quotationId
          ? `Hemos recibido tu solicitud. ID: ${quotationId}`
          : 'Hemos recibido tu solicitud. El equipo te contactará pronto con los precios.',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }],
      );
    } catch (e: any) {
      const status = e?.status;
      const message = e?.message || '';
      console.log('quick failed:', { status, message });

      // 2) Fallback si es 500 (no implementado) o 401/403 (solo admin)
      if (status === 500 || status === 401 || status === 403) {
        usedFallback = true;
        try {
          console.log('Fallback: usando flujo del carrito');
          // Agregar al carrito - backend exige color obligatorio
          const payload = {
            productId,
            quantity,
            color: color.trim() || 'Sin color', // Backend exige color obligatorio
            size: size.trim() || '', // Size opcional
          };
          console.log('Sending payload:', JSON.stringify(payload));

          await QuotationsApi(API).addItemToCart(payload);

          const cartRes: any = await QuotationsApi(API).getCart();
          const cartId: string = cartRes?.cart?._id || cartRes?.cart?.id || cartRes?._id || cartRes?.id || '';
          if (!cartId) throw new Error('No se pudo obtener el ID del carrito');

          // Enviar cotización del carrito
          try {
            await QuotationsApi(API).submit(cartId);
          } catch (submitErr: any) {
            console.log('Submit failed:', submitErr?.message, 'status:', submitErr?.status);
            submitErr.step = 'submit-cart';
            throw submitErr;
          }

          Alert.alert(
            '✓ Cotización solicitada',
            'El producto se agregó al carrito y se envió la cotización. El equipo te contactará pronto.',
            [{ text: 'Aceptar', onPress: () => navigation.goBack() }],
          );
        } catch (fallbackErr: any) {
          console.log('Fallback failed:', fallbackErr?.message, 'status:', fallbackErr?.status);
          const errStep = fallbackErr?.step || 'desconocido';
          Alert.alert(
            'Error',
            `No se pudo crear la cotización. Paso que falló: ${errStep}. Detalles: ${fallbackErr?.message || 'Error desconocido'}`,
          );
        }
      } else {
        // Otro error (red, 400, etc.)
        Alert.alert('Error', formatErr(e));
      }
    } finally {
      setLoadingQuote(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Imagen principal ── */}
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.mainImage} resizeMode="cover" />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="image-outline" size={56} color={theme.colors.muted} />
        </View>
      )}

      {/* ── Info del producto ── */}
      <View style={styles.infoBlock}>
        <Text style={[styles.productName, { color: theme.colors.text }]}>{productName}</Text>
        {!!categoryName && (
          <Text style={[styles.categoryBadge, { color: theme.colors.muted }]}>{categoryName}</Text>
        )}
      </View>

      {/* ── Descripción ── */}
      {!!descriptionText && (
        <View style={[styles.section, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>Descripción</Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>{descriptionText}</Text>
        </View>
      )}

      {/* ── Personalización ── */}
      <View style={[styles.section, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>Personalización</Text>

        <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Color (opcional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="Ej: Caoba, Nogal, Blanco..."
          placeholderTextColor={theme.colors.muted}
          value={color}
          onChangeText={setColor}
          returnKeyType="next"
        />

        <Text style={[styles.inputLabel, { color: theme.colors.text, marginTop: 12 }]}>Medida / Talla (opcional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="Ej: 2m x 1m, Mediano, Grande..."
          placeholderTextColor={theme.colors.muted}
          value={size}
          onChangeText={setSize}
          returnKeyType="done"
        />
      </View>

      {/* ── Cantidad ── */}
      <View style={[styles.section, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>Cantidad</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={[styles.qtyBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Ionicons name="remove" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.qtyValue, { color: theme.colors.text }]}>{quantity}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
            onPress={() => setQuantity((q) => q + 1)}
          >
            <Ionicons name="add" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Botones de acción ── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.btnPrimary, (loadingCart || loadingQuote) && styles.btnDisabled]}
          onPress={addToCart}
          disabled={loadingCart || loadingQuote}
          activeOpacity={0.85}
        >
          {loadingCart
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="cart-outline" size={19} color="#fff" />}
          <Text style={styles.btnPrimaryText}>Añadir al carrito</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSecondary, { borderColor: theme.colors.primary }, (loadingCart || loadingQuote) && styles.btnDisabled]}
          onPress={requestQuote}
          disabled={loadingCart || loadingQuote}
          activeOpacity={0.85}
        >
          {loadingQuote
            ? <ActivityIndicator size="small" color={theme.colors.primary} />
            : <Ionicons name="pricetag-outline" size={19} color={theme.colors.primary} />}
          <Text style={[styles.btnSecondaryText, { color: theme.colors.primary }]}>Solicitar cotización</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainImage: { width: '100%', height: 280 },
  imagePlaceholder: {
    margin: 16,
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoBlock: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  productName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  categoryBadge: { fontSize: 13, fontWeight: '500' },

  section: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  paragraph: { fontSize: 14, lineHeight: 22 },

  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  qtyBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 22, fontWeight: '800', minWidth: 32, textAlign: 'center' },

  actionsRow: { marginHorizontal: 16, marginTop: 20, gap: 12 },
  btnPrimary: {
    backgroundColor: BROWN,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnSecondary: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  btnSecondaryText: { fontWeight: '800', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
});


