import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useAppStore } from '../../../store/appStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SalesDocument } from '../../../domain/types';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../../ui/ToastProvider';
import { scale, moderateScale, responsiveFontSize, useDeviceBreakpoints } from '../../../theme/responsive';
import { API } from '../../../config';
import { OrdersApi } from '../../../api/client';

export default function OrderDetailScreen() {
  const { theme } = useTheme();
  const toast = useToast();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const documentId = route.params?.documentId as string;
  const documents = useAppStore((s) => s.documents);
  const updateOrderState = useAppStore((s) => s.updateOrderState);
  const [remoteDoc, setRemoteDoc] = React.useState<SalesDocument | undefined>(undefined);
  const [triedFetch, setTriedFetch] = React.useState(false);
  const doc = (documents.find((d) => d.id === documentId) as SalesDocument | undefined) || remoteDoc;

  useEffect(() => {
    (async () => {
      if (doc || !API || triedFetch) return;
      setTriedFetch(true);
      try {
        const res: any = await OrdersApi(API).get(documentId);
        if (!res) return;
        const o: any = res?.order || res;
        if (!o) return;
        const mapped: SalesDocument = {
          id: String(o?._id || o?.id || documentId),
          clientId: String(o?.user?._id || o?.user?.id || ''),
          clientName: o?.user?.name || '',
          clientEmail: o?.user?.email || '',
          items: (o?.items || []).map((it: any) => ({
            id: String(it?._id || it?.id || Math.random()),
            name: it?.detalles || (it?.id_servicio?.name || 'Servicio'),
            price: Number(it?.valor || 0),
            observations: it?.detalles,
          })),
          status: 'Order' as any,
          orderState: (o?.paymentStatus || 'PENDING') as any,
          createdAt: o?.createdAt || new Date().toISOString(),
          updatedAt: o?.updatedAt || new Date().toISOString(),
          deliveryDate: o?.deliveryDate,
        };
        setRemoteDoc(mapped);
      } catch {
        // ignore; doc seguirá undefined y se mostrará "no encontrado"
      }
    })();
  }, [API, documentId, doc, triedFetch]);

  const isLoading = !doc && !triedFetch;
  const notFound = !doc && triedFetch;

  const documentIdRef = (doc?.id ?? documentId) as string;
  const createdAt = doc?.createdAt;
    const items = Array.isArray(doc?.items) ? (doc?.items as any[]) : [];
  const orderState = ((doc?.orderState as any) ?? 'PENDING') as 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  const orderStateLabel = orderState === 'CONFIRMED' ? 'Confirmado' : orderState === 'CANCELLED' ? 'Cancelado' : 'En proceso';
  const orderStateIcon: React.ComponentProps<typeof Ionicons>['name'] =
    orderState === 'CONFIRMED' ? 'checkmark-circle' : orderState === 'CANCELLED' ? 'close-circle' : 'time';

  const total = useMemo(() => items.reduce((sum, it) => sum + it.price, 0), [items]);
  const restante = useMemo(() => Math.max(0, Math.round(total * 0.2)), [total]);
  const { isLargePhone, isTabletLike } = useDeviceBreakpoints();
  const fechaEntrega = useMemo(() => {
    const src = (doc as any)?.deliveryDate ?? createdAt ?? new Date().toISOString();
    const base = new Date(src);
    return base.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  }, [doc, createdAt]);

  // (Reseñas removidas aquí; se gestionan en la pantalla de Reseñas)

  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ padding: theme.spacing(isTabletLike ? 3 : 2), paddingBottom: theme.spacing(4) }}>
      {isLoading ? (
        <Text style={{ color: theme.colors.text }}>Cargando pedido...</Text>
      ) : notFound ? (
        <Text style={{ color: theme.colors.text }}>Pedido no encontrado</Text>
      ) : (
        <>
      <View style={[
        styles.statusCard,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius,
          padding: theme.spacing(1.5),
          marginBottom: theme.spacing(1.5),
        },
      ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name={orderStateIcon} size={moderateScale(18)} color={orderState === 'CANCELLED' ? theme.colors.danger : orderState === 'CONFIRMED' ? theme.colors.success : theme.colors.warning} />
          <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(14) }}>{orderStateLabel}</Text>
        </View>
      </View>

      {/* Cliente card */}
      <View style={[
        styles.clientCard,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius,
          padding: theme.spacing(1.5),
          marginBottom: theme.spacing(1.5),
        },
      ]}>
        <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: theme.spacing(1), fontSize: responsiveFontSize(14) }}>Cliente</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: scale(56), height: scale(56), borderRadius: theme.radius, backgroundColor: '#D9D9D9' }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(14) }}>{doc?.clientName || 'Cliente'}</Text>
            {doc?.clientEmail && (
              <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(11) }}>{doc.clientEmail}</Text>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: theme.spacing(1.5) }}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Llamar al cliente" style={[styles.ghostBtn, { borderColor: theme.colors.border, borderRadius: theme.radius, paddingVertical: theme.spacing(1.25) }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="call" size={moderateScale(16)} color={theme.colors.text} />
              <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Llamar</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Enviar correo al cliente" style={[styles.ghostBtn, { borderColor: theme.colors.border, borderRadius: theme.radius, paddingVertical: theme.spacing(1.25) }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="mail" size={moderateScale(16)} color={theme.colors.text} />
              <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Enviar correo</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider title Detalles */}
      <View style={{ alignItems: 'center', marginTop: theme.spacing(2), marginBottom: theme.spacing(2) }}>
        <View style={[styles.line, { backgroundColor: theme.colors.text, width: scale(160) }]} />
        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(18), marginVertical: 8 }}>Detalles</Text>
        <View style={[styles.line, { backgroundColor: theme.colors.text, width: scale(160) }]} />
      </View>

      {/* Two-column details */}
      <View style={styles.twoColRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(12) }}>Fecha de entrega</Text>
          <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(14) }}>{fechaEntrega}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(12), textAlign: 'right' }}>Estado</Text>
          <Text style={{ color: theme.colors.text, fontWeight: '700', textAlign: 'right', fontSize: responsiveFontSize(14) }}>{orderState === 'CONFIRMED' ? 'Confirmado' : orderState === 'CANCELLED' ? 'Cancelado' : 'Pendiente'}</Text>
        </View>
      </View>

      <View style={styles.twoColRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(12) }}>Precio acordado</Text>
          <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(14) }}>$ {total.toLocaleString()} COP</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(12), textAlign: 'right' }}>Valor Restante</Text>
          <Text style={{ color: theme.colors.text, fontWeight: '700', textAlign: 'right', fontSize: responsiveFontSize(14) }}>$ {restante.toLocaleString()} COP</Text>
        </View>
      </View>

      {/* Reseñas: ver pantalla dedicada de Reseñas */}

      {/* Bottom actions */}
      <View style={[styles.bottomActions, { marginTop: theme.spacing(2.5), marginBottom: 4 }]}>
        <TouchableOpacity style={[styles.primaryGhost, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={() => navigation.navigate('OrderEdit', { documentId: documentIdRef })}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Editar pedido</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filledBtn, { backgroundColor: theme.colors.primary }]}
          onPress={async () => {
            try {
              if (!API) throw new Error('Configura API');
              const next = orderState === 'CONFIRMED' ? 'en_proceso' : 'confirmado';
              await OrdersApi(API).updateStatus(documentIdRef, next);
              // refrescar
              try {
                const fetched: any = await OrdersApi(API).get(documentIdRef);
                const o: any = fetched?.order || fetched;
                if (o) {
                  const mapped: SalesDocument = {
                    id: String(o?._id || o?.id || documentIdRef),
                    clientId: String(o?.user?._id || o?.user?.id || ''),
                    clientName: o?.user?.name || '',
                    clientEmail: o?.user?.email || '',
                    items: (o?.items || []).map((it: any) => ({
                      id: String(it?._id || it?.id || Math.random()),
                      name: it?.detalles || (it?.id_servicio?.name || 'Servicio'),
                      price: Number(it?.valor || 0),
                      observations: it?.detalles,
                    })),
                    status: 'Order' as any,
                    orderState: (o?.paymentStatus || (o?.status === 'confirmado' ? 'CONFIRMED' : 'PENDING')) as any,
                    createdAt: o?.createdAt || new Date().toISOString(),
                    updatedAt: o?.updatedAt || new Date().toISOString(),
                    deliveryDate: o?.deliveryDate,
                  };
                  setRemoteDoc(mapped);
                }
              } catch {}
              toast.show('Estado actualizado', 'success');
            } catch (e) {
              toast.show((e as Error)?.message || 'No se pudo cambiar el estado', 'error');
            }
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Cambiar Estado</Text>
        </TouchableOpacity>
      </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  clientCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
    line: { width: 160, height: 3, borderRadius: 2 },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  bottomActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  primaryGhost: { flex: 1, borderWidth: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  filledBtn: { flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  changeStateBtn: { marginTop: 12, borderWidth: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  ghostBtn: { flex: 1, borderWidth: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 10 },
  // estilos de reseñas eliminados aquí
});