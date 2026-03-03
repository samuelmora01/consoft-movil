import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { ReviewsApi, OrdersApi, QuotationsApi } from '../api/client';
import { API } from '../config';

type Review = {
  _id: string;
  user?: { name?: string };
  rating: number;
  comment?: string;
  createdAt: string;
};

export default function OrderDetailCustomerScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const { order: orderParam } = route.params || {};
  const kind: 'order' | 'quotation' = orderParam?.__kind === 'quotation' ? 'quotation' : 'order';
  const orderId = orderParam?._id || orderParam?.id;
  
  const [order, setOrder] = useState<any>(orderParam);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  
  // Calcular totales del pedido
  const total = order?.total ?? order?.totalEstimate ?? (Array.isArray(order?.items) ? order.items.reduce((sum: number, it: any) => sum + (Number(it.valor) || 0), 0) : 0);
  const paid = kind === 'quotation'
    ? 0
    : (order?.paid || (Array.isArray(order?.payments) ? order.payments.filter((p: any) => p.status === 'aprobado' || p.status === 'confirmado').reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) : 0) + (order?.initialPayment?.amount || 0));
  const remaining = total - paid;
  const percentPaid = total > 0 ? Math.round((paid / total) * 100) : 0;
  
  // Estado inteligente según % pagado
  let status = order?.status || 'pendiente';
  if (percentPaid >= 100) status = 'completado';
  else if (percentPaid >= 30) status = 'en_proceso';
  else if (percentPaid > 0) status = 'pendiente_abono';
  else status = 'pendiente';
  
  const statusColor = status === 'completado' ? '#16a34a' : status === 'en_proceso' ? '#3b82f6' : status === 'pendiente_abono' ? '#f59e0b' : '#9ca3af';
  const statusLabel = status === 'completado' ? 'Completado' : status === 'en_proceso' ? 'En proceso' : status === 'pendiente_abono' ? 'Abono parcial' : 'Pendiente';
  
  // Días restantes (15 días desde productionStartedAt o startedAt)
  const startDate = order?.productionStartedAt || order?.startedAt;
  const daysRemaining = startDate ? Math.max(0, 15 - Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))) : 15;

  useEffect(() => {
    if (orderId && API) {
      // Cargar detalle completo del pedido
      setLoading(true);
      const loader = kind === 'quotation'
        ? QuotationsApi(API).get(orderId)
        : OrdersApi(API).get(orderId);

      loader
        .then((data: any) => {
          const normalized = kind === 'quotation' ? (data?.quotation || data) : (data?.order || data);
          setOrder(normalized || orderParam);
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      // Reseñas solo aplican a pedidos
      if (kind === 'order') {
        setLoadingReviews(true);
        ReviewsApi(API)
          .list(orderId)
          .then((data: any) => {
            const reviewsList = Array.isArray(data) ? data : [];
            setReviews(reviewsList);
            if (reviewsList.length > 0) {
              const avg = reviewsList.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviewsList.length;
              setAverageRating(Math.round(avg * 10) / 10);
            }
          })
          .catch(() => {})
          .finally(() => setLoadingReviews(false));
      } else {
        setReviews([]);
        setAverageRating(0);
        setLoadingReviews(false);
      }
    }
  }, [orderId]);
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        {order?.image ? (
          <Image source={{ uri: order.image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, { backgroundColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="cube-outline" size={32} color={theme.colors.muted} />
          </View>
        )}
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {kind === 'quotation' ? 'Cotización' : 'Pedido'} #{order?.number || order?.code || order?._id?.slice(-6) || '—'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.muted }]}>{Array.isArray(order?.items) && order.items.length > 0 ? `${order.items.length} ${order.items.length === 1 ? 'artículo' : 'artículos'}` : ''}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}> 
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Items del pedido */}
      {Array.isArray(order?.items) && order.items.length > 0 && (
        <>
          <View style={styles.slotsRow}>
            {order.items.slice(0, 3).map((item: any, i: number) => (
              <View key={i} style={[styles.slotBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.slotImage} />
                ) : (
                  <Ionicons name="cube-outline" size={22} color={theme.colors.primary} />
                )}
              </View>
            ))}
          </View>
          <View style={styles.slotLabels}>
            {order.items.slice(0, 3).map((item: any, i: number) => (
              <Text key={i} numberOfLines={1} style={[styles.slotLabel, { color: theme.colors.muted }]}>
                {item.detalles || item.id_producto?.name || item.id_servicio?.name || 'Artículo'}
              </Text>
            ))}
          </View>
        </>
      )}

      {/* Divider title */}
      <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>Detalles</Text>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
      </View>

      {/* Resumen financiero */}
      <View style={[styles.financialCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.financialRow}>
          <Text style={[styles.financialLabel, { color: theme.colors.muted }]}>Total del pedido</Text>
          <Text style={[styles.financialValue, { color: theme.colors.text }]}>${total.toLocaleString()}</Text>
        </View>
        <View style={styles.financialRow}>
          <Text style={[styles.financialLabel, { color: theme.colors.muted }]}>Pagado ({percentPaid}%)</Text>
          <Text style={[styles.financialValue, { color: '#16a34a' }]}>${paid.toLocaleString()}</Text>
        </View>
        <View style={[styles.financialRow, { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, marginTop: 8 }]}>
          <Text style={[styles.financialLabel, { color: theme.colors.muted, fontWeight: '800' }]}>Restante</Text>
          <Text style={[styles.financialValue, { color: remaining > 0 ? '#dc2626' : '#16a34a', fontWeight: '800', fontSize: 20 }]}>${remaining.toLocaleString()}</Text>
        </View>
      </View>

      {/* Detalles del pedido */}
      <View style={styles.twoColRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.muted, { color: theme.colors.muted }]}>Fecha de entrega</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{order?.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : '—'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.muted, { textAlign: 'right', color: theme.colors.muted }]}>Días restantes</Text>
          <Text style={[styles.value, { textAlign: 'right', color: theme.colors.text }]}>{status === 'en_proceso' ? `${daysRemaining} días` : '—'}</Text>
        </View>
      </View>

      <View style={styles.twoColRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.muted, { color: theme.colors.muted }]}>Estado</Text>
          <Text style={[styles.value, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.muted, { textAlign: 'right', color: theme.colors.muted }]}>Dirección</Text>
          <Text numberOfLines={1} style={[styles.value, { textAlign: 'right', color: theme.colors.text }]}>{order?.address || '—'}</Text>
        </View>
      </View>

      {/* Pagos realizados */}
      {(order?.initialPayment || (Array.isArray(order?.payments) && order.payments.length > 0)) && (
        <>
          <Text style={[styles.section, { color: theme.colors.text, paddingHorizontal: 0, marginTop: 20 }]}>Pagos realizados</Text>
          {order?.initialPayment && (
            <View style={[styles.paymentCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.paymentHeader}>
                <Ionicons name="cash-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.paymentTitle, { color: theme.colors.text }]}>Pago inicial</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={[styles.paymentLabel, { color: theme.colors.muted }]}>Monto</Text>
                <Text style={[styles.paymentValue, { color: theme.colors.text }]}>${(order.initialPayment.amount || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={[styles.paymentLabel, { color: theme.colors.muted }]}>Método</Text>
                <Text style={[styles.paymentValue, { color: theme.colors.text }]}>{order.initialPayment.method === 'cash' ? 'Efectivo' : 'Transferencia'}</Text>
              </View>
            </View>
          )}
          {Array.isArray(order?.payments) && order.payments.filter((p: any) => p.status === 'aprobado' || p.status === 'confirmado').map((payment: any, idx: number) => (
            <View key={payment._id || idx} style={[styles.paymentCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.paymentHeader}>
                <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.paymentTitle, { color: theme.colors.text }]}>Pago #{idx + 1}</Text>
                <View style={[styles.approvedBadge, { backgroundColor: '#16a34a20' }]}>
                  <Text style={[styles.approvedText, { color: '#16a34a' }]}>Aprobado</Text>
                </View>
              </View>
              <View style={styles.paymentRow}>
                <Text style={[styles.paymentLabel, { color: theme.colors.muted }]}>Monto</Text>
                <Text style={[styles.paymentValue, { color: theme.colors.text }]}>${(payment.amount || 0).toLocaleString()}</Text>
              </View>
              {payment.paidAt && (
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: theme.colors.muted }]}>Fecha</Text>
                  <Text style={[styles.paymentValue, { color: theme.colors.text }]}>{new Date(payment.paidAt).toLocaleDateString()}</Text>
                </View>
              )}
            </View>
          ))}
        </>
      )}
      
      <Text style={[styles.muted, { marginTop: 16, color: theme.colors.muted }]}>Nota</Text>
      <Text style={{ color: theme.colors.muted, lineHeight: 18 }}>
        {percentPaid >= 100 ? 'Tu pedido está completamente pagado. ¡Gracias!' : percentPaid >= 30 ? `Tu pedido está en producción. Restante: $${remaining.toLocaleString()}` : 'Realiza un abono del 30% para iniciar la producción de tu pedido.'}
      </Text>

      {kind === 'order' ? (
        <>
          {/* Reseñas del pedido */}
          <View style={styles.reviewsHeader}>
            <Text style={[styles.section, { color: theme.colors.text }]}>Reseñas del pedido</Text>
            {averageRating > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color="#F6C453" />
                <Text style={[styles.ratingText, { color: theme.colors.text }]}>{averageRating}</Text>
                <Text style={[styles.reviewCount, { color: theme.colors.muted }]}>({reviews.length})</Text>
              </View>
            )}
          </View>

          {loadingReviews ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.muted }]}>Cargando reseñas...</Text>
            </View>
          ) : reviews.length === 0 ? (
            <View style={[styles.emptyReviews, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Ionicons name="chatbox-outline" size={48} color={theme.colors.muted} />
              <Text style={[styles.emptyText, { color: theme.colors.muted }]}>Aún no hay reseñas</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.muted }]}>Sé el primero en compartir tu experiencia</Text>
            </View>
          ) : (
            reviews.slice(0, 3).map((review) => (
              <View key={review._id} style={[styles.reviewCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating ? 'star' : 'star-outline'}
                        size={14}
                        color={star <= review.rating ? '#F6C453' : theme.colors.muted}
                      />
                    ))}
                  </View>
                  <Text style={[styles.reviewDate, { color: theme.colors.muted }]}>
                    {new Date(review.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                {review.comment && (
                  <Text style={[styles.reviewComment, { color: theme.colors.text }]}>{review.comment}</Text>
                )}
                {review.user?.name && (
                  <Text style={[styles.reviewAuthor, { color: theme.colors.muted }]}>— {review.user.name}</Text>
                )}
              </View>
            ))
          )}
        </>
      ) : null}

      {reviews.length > 3 && (
        <TouchableOpacity style={styles.showMoreBtn}>
          <Text style={[styles.showMoreText, { color: theme.colors.primary }]}>Ver todas las reseñas ({reviews.length})</Text>
        </TouchableOpacity>
      )}

      {/* CTA */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('OrderPayment', { order })}>
          <Text style={styles.primaryBtnText}>Siguiente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reviewBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => navigation.navigate('ServiceReview', { orderId, orderTitle: `Pedido #${order?.number || '—'}` })}
        >
          <Ionicons name="star-outline" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.reviewBtnText, { color: theme.colors.primary }]}>Deja una reseña</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  title: { fontWeight: '800', fontSize: 16 },
  subtitle: {},
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '800' },
  slotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  slotBox: { width: '31%', height: 96, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  slotImage: { width: '100%', height: '100%', borderRadius: 12 },
  slotLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  slotLabel: { flex: 1, textAlign: 'center', fontSize: 12 },
  divider: { width: 160, height: 3, borderRadius: 2 },
  detailsTitle: { fontWeight: '700', fontSize: 18, marginVertical: 8 },
  section: { paddingHorizontal: 16, marginTop: 16, fontWeight: '800', fontSize: 16 },
  financialCard: { marginTop: 16, borderWidth: 1, borderRadius: 12, padding: 16 },
  financialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  financialLabel: { fontSize: 14 },
  financialValue: { fontWeight: '800', fontSize: 16 },
  paymentCard: { marginTop: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  paymentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  paymentTitle: { fontWeight: '700', flex: 1 },
  approvedBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  approvedText: { fontSize: 11, fontWeight: '800' },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  paymentLabel: { fontSize: 13 },
  paymentValue: { fontWeight: '600', fontSize: 13 },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  muted: { fontSize: 12 },
  value: { fontWeight: '800' },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  infoBox: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12 },
  infoTitle: { fontSize: 12 },
  infoValue: { fontWeight: '700', marginTop: 4 },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 16 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontWeight: '800', fontSize: 16 },
  reviewCount: { fontSize: 14 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  loadingText: { fontSize: 14 },
  emptyReviews: { marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { fontWeight: '700', fontSize: 16, marginTop: 12 },
  emptySubtext: { fontSize: 14, marginTop: 4 },
  reviewCard: { marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: 12 },
  reviewComment: { lineHeight: 20, marginBottom: 8 },
  reviewAuthor: { fontSize: 12, fontStyle: 'italic' },
  showMoreBtn: { marginHorizontal: 16, marginTop: 12, alignItems: 'center', paddingVertical: 8 },
  showMoreText: { fontWeight: '700', fontSize: 14 },
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 26 },
  primaryBtn: { flex: 1, backgroundColor: '#6b4028', borderRadius: 14, alignItems: 'center', paddingVertical: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  reviewBtn: { flex: 1, borderWidth: 1, borderRadius: 14, alignItems: 'center', paddingVertical: 12, flexDirection: 'row', justifyContent: 'center' },
  reviewBtnText: { fontWeight: '800' },
});


