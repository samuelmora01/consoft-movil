import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useAppStore } from '../../../store/appStore';
import { SalesDocument, OrderState } from '../../../domain/types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale, responsiveFontSize } from '../../../theme/responsive';
import { API } from '../../../config';
import { OrdersApi } from '../../../api/client';

type SortKey = 'date' | 'client' | 'price';
type SortDir = 'asc' | 'desc';

export default function OrdersListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const documentsStore = useAppStore((s) => s.documents);
  const [documents, setDocuments] = useState<SalesDocument[]>(documentsStore);
  const [q, setQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  async function loadOrders() {
    if (!API) return;
    try {
      console.log('[OrdersListScreen] Loading orders from API...');
      const res: any = await OrdersApi(API).listAdmin();
      console.log('[OrdersListScreen] API response keys:', Object.keys(res));
      const list: any[] = (res?.orders || res?.data || (Array.isArray(res) ? res : [])) as any[];
      console.log('[OrdersListScreen] Parsed list length:', list.length);
      const mapped: SalesDocument[] = list.map((o: any) => {
        console.log('[OrdersListScreen] Mapping order:', o);
        // Según documentación: items tienen tipo, id_producto/id_servicio, detalles, cantidad, valor
        const items = (o?.items || []).map((it: any) => ({
          id: String(it?._id || it?.id || Math.random()),
          name: it?.detalles || it?.productName || (it?.id_producto?.name || it?.id_servicio?.name || 'Item'),
          price: Number(it?.valor || 0),
          quantity: Number(it?.cantidad || 1),
          observations: it?.detalles,
        }));
        console.log('[OrdersListScreen] Mapped items:', items);
        // Imagen: buscar solo en items (attachments ya no se usan en admin)
        const featuredFromItems =
          (o?.items || []).find((it: any) => it?.imageUrl)?.imageUrl ||
          (o?.items || []).find((it: any) => it?.id_producto?.imageUrl)?.id_producto?.imageUrl ||
          (o?.items || []).find((it: any) => it?.id_servicio?.imageUrl)?.id_servicio?.imageUrl;
        const featured = featuredFromItems || undefined;
        const mappedDoc = {
          id: (o?._id || o?.id) as string,
          clientId: (o?.user?._id || o?.user?.id || 'unknown') as any,
          clientName: o?.user?.name || '',
          clientEmail: o?.user?.email || '',
          items,
          status: o?.status || 'En proceso',
          orderState: (o?.paymentStatus || 'Pendiente') as any,
          address: o?.address || '',
          images: [],
          featuredImage: undefined, // Ya no se usan imágenes en pedidos de cliente
          createdAt: o?.createdAt || o?.startedAt || new Date().toISOString(),
          updatedAt: o?.updatedAt || new Date().toISOString(),
        } as SalesDocument;
        console.log('[OrdersListScreen] Mapped document:', mappedDoc);
        return mappedDoc;
      });
      setDocuments(mapped);
      console.log('[OrdersListScreen] Orders loaded successfully:', mapped.length);
    } catch (e) {
      console.error('[OrdersListScreen] Error loading orders:', e);
      setDocuments(documentsStore);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadOrders();
      return () => {};
    }, [])
  );

  const filteredAndSorted = useMemo(() => {
    const query = q.trim().toLowerCase();
    let base = documents;

    if (query) {
      base = documents.filter((d) => {
        const id = String(d.id || '').toLowerCase();
        const clientName = String((d as any).clientName || '').toLowerCase();
        const clientEmail = String((d as any).clientEmail || '').toLowerCase();
        return id.includes(query) || clientName.includes(query) || clientEmail.includes(query);
      });
    }

    const totalPrice = (d: SalesDocument) => d.items.reduce((s, i) => s + i.price, 0);
    const dateValue = (d: SalesDocument) => {
      const raw = (d.createdAt || d.updatedAt || '') as any;
      const ts = new Date(raw).getTime();
      return Number.isFinite(ts) ? ts : 0;
    };
    const clientValue = (d: SalesDocument) => String((d as any).clientName || '').toLowerCase();

    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted = [...base].sort((a, b) => {
      if (sortKey === 'price') return (totalPrice(a) - totalPrice(b)) * dir;
      if (sortKey === 'client') return clientValue(a).localeCompare(clientValue(b)) * dir;
      return (dateValue(a) - dateValue(b)) * dir;
    });

    return sorted;
  }, [q, documents, sortKey, sortDir]);

  const empty = !documents.length;
  console.log('[OrdersListScreen] Documents state:', documents.length, documents);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, padding: theme.spacing(2) }]}> 
      {empty ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing(3) }}>
          <Text style={{ fontSize: responsiveFontSize(22), fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing(2) }}>Pedidos</Text>
          <MaterialCommunityIcons name="sofa-outline" size={moderateScale(120)} color={theme.colors.text} />
          <Text style={{ color: theme.colors.muted, marginTop: theme.spacing(2), fontSize: responsiveFontSize(12), textAlign: 'center' }}>Aún no tienes Pedidos asignados</Text>
        </View>
      ) : (
        <>
          <TextInput
            placeholder="Buscar pedidos"
            placeholderTextColor={theme.colors.muted}
            value={q}
            onChangeText={setQ}
            style={[
              styles.search,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
                borderRadius: theme.radius,
                paddingHorizontal: theme.spacing(1.5),
                paddingVertical: theme.spacing(1.25),
                marginBottom: theme.spacing(1),
              },
            ]}
          />

          <View style={[styles.filtersRow, { marginBottom: theme.spacing(1.5) }]}>
            <TouchableOpacity
              onPress={() => setShowFilters((v) => !v)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius,
                },
              ]}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="filter-variant" size={moderateScale(18)} color={theme.colors.text} />
              <Text style={{ color: theme.colors.text, fontWeight: '700', marginLeft: 8 }}>
                Filtros
              </Text>
              <Text style={{ color: theme.colors.muted, marginLeft: 8 }}>
                {sortKey === 'date' ? 'Fecha' : sortKey === 'client' ? 'Cliente' : 'Precio'} · {sortDir === 'asc' ? 'Asc' : 'Desc'}
              </Text>
            </TouchableOpacity>
          </View>

          {showFilters ? (
            <View style={[styles.filtersPanel, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderRadius: theme.radius, marginBottom: theme.spacing(1.5) }]}>
              <View style={styles.filtersPanelRow}>
                <TouchableOpacity
                  onPress={() => setSortKey('date')}
                  style={[styles.pill, { borderColor: theme.colors.border, backgroundColor: sortKey === 'date' ? theme.colors.background : theme.colors.card }]}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Fecha</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortKey('client')}
                  style={[styles.pill, { borderColor: theme.colors.border, backgroundColor: sortKey === 'client' ? theme.colors.background : theme.colors.card }]}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Cliente</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortKey('price')}
                  style={[styles.pill, { borderColor: theme.colors.border, backgroundColor: sortKey === 'price' ? theme.colors.background : theme.colors.card }]}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Precio</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.filtersPanelRow, { marginTop: 10 }]}>
                <TouchableOpacity
                  onPress={() => setSortDir('asc')}
                  style={[styles.pill, { borderColor: theme.colors.border, backgroundColor: sortDir === 'asc' ? theme.colors.background : theme.colors.card }]}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Ascendente</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortDir('desc')}
                  style={[styles.pill, { borderColor: theme.colors.border, backgroundColor: sortDir === 'desc' ? theme.colors.background : theme.colors.card }]}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Descendente</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
          
          <FlatList
            data={filteredAndSorted}
            keyExtractor={(d: SalesDocument) => d.id}
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadOrders().finally(() => setRefreshing(false)); }}
            contentContainerStyle={{ paddingBottom: theme.spacing(3) }}
            renderItem={({ item: d }) => (
              <TouchableOpacity
                onPress={() => navigation.navigate('OrderDetail', { documentId: d.id })}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius,
                    marginBottom: theme.spacing(2),
                    overflow: 'hidden',
                  },
                ]}
                activeOpacity={0.9}
              >
                <View style={{ position: 'relative', padding: theme.spacing(1.75) }}>
                  <MaterialCommunityIcons name="truck-delivery-outline" size={moderateScale(20)} color={theme.colors.primary} style={{ position: 'absolute', right: theme.spacing(0.5), top: theme.spacing(0.5) }} />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={[styles.thumb, { borderRadius: theme.radius, width: scale(64), height: scale(64), alignItems: 'center', justifyContent: 'center' }]}>
                      <MaterialCommunityIcons name="package-variant-closed" size={moderateScale(24)} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(14), textDecorationLine: 'underline' }}>
                        Pedido #{d.id.slice(0, 6).toUpperCase()}
                      </Text>
                      <Text style={{ color: theme.colors.muted, marginTop: 2, fontSize: responsiveFontSize(11) }} numberOfLines={1}>
                        Cliente: {(d as any).clientName || 'Sin nombre'}
                      </Text>
                      <Text style={{ color: theme.colors.muted, marginTop: 2, fontSize: responsiveFontSize(10) }} numberOfLines={1}>
                        {d.items.length > 0 ? d.items.map(i => `${i.name} (x${(i as any).quantity || 1})`).join(', ') : 'Sin items'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6, gap: 8 }}>
                        <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: responsiveFontSize(22) }}>
                          ${d.items.reduce((s, i) => s + (i.price * ((i as any).quantity || 1)), 0).toLocaleString()}
                        </Text>
                        <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(10) }}>
                          {(d as any).orderState || 'Pendiente'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={{ backgroundColor: theme.colors.border, paddingVertical: theme.spacing(1.25), paddingHorizontal: theme.spacing(2), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(10) }}>
                      Estado: {(d as any).status || 'En proceso'}
                    </Text>
                    <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(12), marginTop: 2 }}>
                      Creado: {new Date(d.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(10) }}>
                      Dirección
                    </Text>
                    <Text style={{ color: theme.colors.text, fontSize: responsiveFontSize(11), marginTop: 2 }} numberOfLines={1}>
                      {(d as any).address || 'Sin dirección'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}
      {empty ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('OrderEdit', {})}
          style={[
            styles.emptyCta,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              paddingVertical: theme.spacing(1.75),
              paddingHorizontal: theme.spacing(2.25),
              borderRadius: 999,
              bottom: theme.spacing(6),
            },
          ]}
        > 
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Agregar Pedido</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => navigation.navigate('OrderEdit', {})} style={[styles.fab, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, right: theme.spacing(2), bottom: theme.spacing(2), paddingVertical: theme.spacing(1.5), paddingHorizontal: theme.spacing(2), borderRadius: theme.radius }]}> 
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Agregar Pedido</Text>
        </TouchableOpacity>
      )}
            
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { borderWidth: 1 },
  card: { borderWidth: 1 },
  thumb: { width: 64, height: 64, backgroundColor: 'rgba(107, 64, 40, 0.1)' }, // Color dorado claro
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  fab: { position: 'absolute', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  emptyCta: { position: 'absolute', alignSelf: 'center', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },

  filtersRow: { flexDirection: 'row', alignItems: 'center' },
  filterButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, flex: 1 },
  filtersPanel: { borderWidth: 1, padding: 12 },
  filtersPanelRow: { flexDirection: 'row', gap: 10 },
  pill: { flex: 1, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  
});



