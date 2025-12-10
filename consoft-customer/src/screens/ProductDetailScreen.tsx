import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API } from '../config';
import { QuotationsApi } from '../api/client';
import { io } from 'socket.io-client';
import FloatingCartButton from '../components/FloatingCartButton';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { item } = route.params || {};

  async function addToCart() {
    try {
      if (!API) throw new Error('Configura API');
      const cart = await QuotationsApi(API).getCart();
      const cartId: string = (cart as any)?.cart?._id || (cart as any)?._id || (cart as any)?.id;
      await QuotationsApi(API).addItem(cartId, { productId: item?.id || item?._id || route.params?.id, quantity: 1 });
      Alert.alert('Carrito', 'Producto añadido al carrito.');
    } catch (e) {
      Alert.alert('Error', (e as Error)?.message || 'No se pudo añadir al carrito');
    }
  }

  async function quickQuote() {
    try {
      if (!API) throw new Error('Configura API');
      const res: any = await QuotationsApi(API).quick(item?.id || item?._id || route.params?.id, { quantity: 1 });
      const quotationId: string | undefined = res?.quotation?._id || res?.quotation?.id;
      // Enviar primer mensaje al chat con referencia del producto
      try {
        const socket = io(API, { withCredentials: true, transports: ['websocket'] });
        const qid = quotationId || (item?.id || item?._id || route.params?.id);
        socket.emit('quotation:join', { quotationId: qid });
        socket.emit('order:join', { orderId: qid });
        const title = item?.title || item?.name || 'Producto';
        socket.emit('chat:message', { quotationId: qid, orderId: qid, message: `Hola, acabo de solicitar cotización del producto: ${title}.` });
        setTimeout(() => socket.disconnect(), 500);
      } catch {}
      Alert.alert('Cotización', 'Solicitud enviada.');
      const targetId = quotationId || (item?.id || item?._id || route.params?.id);
      navigation.navigate('Perfil' as never, { screen: 'ChatRoom', params: { id: targetId, title: 'Chat' } } as never);
    } catch (e) {
      Alert.alert('Error', (e as Error)?.message || 'No se pudo enviar la cotización');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <FloatingCartButton top={10} left={10} />
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{item?.title ?? item?.name ?? 'Mueble de dos puestos'}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Ionicons name="share-outline" size={20} color="#6b4028" />
          <Ionicons name="bookmark-outline" size={20} color="#6b4028" />
        </View>
      </View>

      <View style={styles.gallery}>
        {[0, 1, 2, 3].map((i) => (
          <Image
            key={i}
            source={{ uri: item?.image || item?.featuredImage || (Array.isArray(item?.images) ? item.images[0] : undefined) || 'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=1200&auto=format&fit=crop' }}
            style={styles.galleryImage}
          />
        ))}
      </View>

      <Text style={styles.title}>{item?.title ?? item?.name ?? 'Mueble de dos puestos'}</Text>
      <Text style={styles.subtitle}>{item?.material ?? item?.category?.name ?? 'Cuero · cuerina'}</Text>

      <View style={styles.colorsRow}>
        {['#000', '#e52b2b', '#5b53ff', '#8b5d3c', '#cbb6a0'].map((c) => (
          <View key={c} style={[styles.colorDot, { backgroundColor: c }]} />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Descripción:</Text>
      <Text style={styles.paragraph}>
        Este elegante sillón de dos puestos, con una longitud de 2.5 metros, es ideal para salas amplias y
        espacios compartidos. Su diseño contemporáneo combina líneas limpias con una estructura robusta,
        ofreciendo una experiencia de confort superior. Perfecto para descansar, recibir visitas o
        complementar la decoración de tu hogar.
      </Text>

      <Text style={styles.sectionTitle}>Características:</Text>
      <View style={styles.featureRow}>
        <Ionicons name="checkmark-circle" size={18} color="#2aae53" />
        <Text style={styles.featureText}>Medida de 2.5 metros</Text>
      </View>
      <View style={styles.featureRow}>
        <Ionicons name="checkmark-circle" size={18} color="#2aae53" />
        <Text style={styles.featureText}>Varios Tipos de tela</Text>
      </View>
      <View style={styles.featureRow}>
        <Ionicons name="checkmark-circle" size={18} color="#2aae53" />
        <Text style={styles.featureText}>Incluye 3 cojines</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity style={[styles.cta, { flex: 1 }]} onPress={addToCart}>
          <Ionicons name="cart-outline" size={16} color="#fff" />
          <Text style={styles.ctaText}>Añadir al carrito</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctaSecondary, { flex: 1 }]} onPress={quickQuote}>
          <Ionicons name="pricetag-outline" size={16} color="#6b4028" />
          <Text style={[styles.ctaText, { color: '#6b4028' }]}>Cotizar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const BROWN = '#6b4028';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontWeight: '700', color: '#222' },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  galleryImage: { width: '48%', height: 90, borderRadius: 8 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#7f6f62', marginBottom: 10 },
  colorsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  colorDot: { width: 20, height: 20, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 6, marginBottom: 8 },
  paragraph: { color: '#52483f', lineHeight: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  featureText: { color: '#52483f' },
  cta: {
    marginTop: 18,
    backgroundColor: BROWN,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { color: '#fff', fontWeight: '800' },
  ctaSecondary: {
    marginTop: 18,
    backgroundColor: '#efe7e2',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e6ded8',
  },
});


