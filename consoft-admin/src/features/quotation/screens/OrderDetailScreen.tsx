import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useAppStore } from '../../../store/appStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SalesDocument } from '../../../domain/types';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../../ui/ToastProvider';
import { scale, verticalScale, moderateScale, responsiveFontSize, useDeviceBreakpoints } from '../../../theme/responsive';
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
  const [remoteDoc, setRemoteDoc] = useState<SalesDocument | undefined>(undefined);
  const [triedFetch, setTriedFetch] = useState(false);
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
          images: Array.isArray(o?.attachments) ? o.attachments : [],
          featuredImage: undefined,
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
  const images: string[] = Array.isArray(doc?.images) ? (doc?.images as string[]) : [];
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

  function setImageAtSlotLocal(slot: number, uri: string) {
    // actualiza sólo el estado remoto local, para reflejar de inmediato
    setRemoteDoc((prev) => {
      const current = prev?.images ?? [];
      const length = Math.max(slot + 1, current.length);
      const nextImages: string[] = Array.from({ length }, (_, idx) => current[idx] ?? '');
      nextImages[slot] = uri;
      return prev ? { ...prev, images: nextImages, featuredImage: prev.featuredImage ?? uri } : prev;
    });
  }

  async function pickImage(slot: number) {
    try {
      const mediaType: any =
        // Backward/forward compatible across Expo SDKs
        (ImagePicker as any).MediaType?.Images ??
        (ImagePicker as any).MediaTypeOptions?.Images;
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: mediaType, quality: 0.7 });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      let uploadUri = asset.uri;
      // iOS: copiar a caché para obtener file://
      try {
        const name =
          (asset as any).fileName ||
          uploadUri.split('/').pop() ||
          `img_${Date.now()}.jpg`;
        const target = `${FileSystem.cacheDirectory}${name}`;
        await FileSystem.copyAsync({ from: uploadUri, to: target });
        uploadUri = target;
      } catch {
        // si falla copy, intentaremos con la uri original
      }
      // Subir al backend
      if (!API) throw new Error('Configura API');
      await OrdersApi(API).addAttachments(documentIdRef, [uploadUri]);
      // Refrescar detalle
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
            orderState: (o?.paymentStatus || 'PENDING') as any,
            images: Array.isArray(o?.attachments) ? o.attachments : [],
            featuredImage: undefined,
            createdAt: o?.createdAt || new Date().toISOString(),
            updatedAt: o?.updatedAt || new Date().toISOString(),
            deliveryDate: o?.deliveryDate,
          };
          setRemoteDoc(mapped);
        } else {
          // fallback local inmediato
          setImageAtSlotLocal(slot, uploadUri);
        }
      } catch {
        setImageAtSlotLocal(slot, uploadUri);
      }
      toast.show('Imagen añadida', 'success');
    } catch (e) {
      toast.show((e as Error)?.message || 'No se pudo subir la imagen', 'error');
    }
  }

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

      {/* Imágenes por servicio (si no hay items, mostrará 3 slots vacíos con “añadir”) */}
      {(() => {
        const displayItems =
          items.length > 0
            ? items
            : Array.from({ length: 3 }).map((_, i) => ({ id: `placeholder-${i}`, name: '' }));
        return (
          <CarouselImages
            items={displayItems}
            images={images}
            theme={theme}
            pickImage={pickImage}
          />
        );
      })()}

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
                    images: Array.isArray(o?.attachments) ? o.attachments : [],
                    featuredImage: undefined,
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
  imageSlot: { flex: 1, height: 120, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  slotLabelsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  line: { width: 160, height: 3, borderRadius: 2 },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  bottomActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  primaryGhost: { flex: 1, borderWidth: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  filledBtn: { flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  changeStateBtn: { marginTop: 12, borderWidth: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  ghostBtn: { flex: 1, borderWidth: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 10 },
  // estilos de reseñas eliminados aquí
});


type CarouselImagesProps = {
  items: Array<{ id: string; name: string }>;
  images: string[];
  theme: any;
  pickImage: (slot: number) => void;
};

function CarouselImages({ items, images, theme, pickImage }: CarouselImagesProps) {
  const gap = 12;
  const visibleCount = Math.min(3, items.length);
  const scrollRef = useRef<ScrollView | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const slotWidth = useMemo(() => {
    if (containerWidth <= 0) return 0;
    return (containerWidth - gap * (visibleCount - 1)) / visibleCount;
  }, [containerWidth, visibleCount]);

  const maxIndex = Math.max(0, items.length - visibleCount);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < maxIndex;

  function scrollToIndex(next: number) {
    const clamped = Math.max(0, Math.min(next, maxIndex));
    setCurrentIndex(clamped);
    if (scrollRef.current && slotWidth > 0) {
      scrollRef.current.scrollTo({ x: clamped * (slotWidth + gap), animated: true });
    }
  }

  function onPrev() {
    if (!canPrev) return;
    scrollToIndex(currentIndex - 1);
  }

  function onNext() {
    if (!canNext) return;
    scrollToIndex(currentIndex + 1);
  }

  return (
    <View style={{ marginBottom: theme.spacing(1.5) }}>
      <View
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        style={{ position: 'relative' }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ columnGap: gap }}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            if (slotWidth > 0) {
              const idx = Math.round(x / (slotWidth + gap));
              const clamped = Math.max(0, Math.min(idx, maxIndex));
              if (clamped !== currentIndex) setCurrentIndex(clamped);
            }
          }}
          style={{ overflow: 'hidden' }}
        >
          {items.map((it, i) => {
            const uri = images?.[i];
            return (
              <View key={it.id} style={{ width: slotWidth }}>
                <TouchableOpacity
                  style={[
                    styles.imageSlot,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                      borderRadius: theme.radius,
                      height: verticalScale(120),
                    },
                  ]}
                  onPress={() => pickImage(i)}
                  activeOpacity={0.8}
                >
                  {uri ? (
                    <Image
                      source={{ uri }}
                      style={{ width: '100%', height: '100%', borderRadius: theme.radius }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={{ color: theme.colors.muted }}>añadir</Text>
                  )}
                </TouchableOpacity>
                <Text
                  numberOfLines={1}
                  style={{
                    color: theme.colors.muted,
                    textAlign: 'center',
                    marginTop: 6,
                    fontSize: responsiveFontSize(11),
                  }}
                >
                  {it.name}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {items.length > 3 && (
          <>
            <TouchableOpacity
              onPress={onPrev}
              disabled={!canPrev}
              style={{
                position: 'absolute',
                left: -2,
                top: verticalScale(120) / 2 - 18,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canPrev ? 1 : 0.4,
              }}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNext}
              disabled={!canNext}
              style={{
                position: 'absolute',
                right: -2,
                top: verticalScale(120) / 2 - 18,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canNext ? 1 : 0.4,
              }}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

 