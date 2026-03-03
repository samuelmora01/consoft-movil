import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FloatingCartButton from '../components/FloatingCartButton';
import { useTheme } from '../theme/theme';
import { ReviewsApi } from '../api/client';
import { API } from '../config';

type Props = {
  route: { params?: { item?: { _id?: string; id?: string; title?: string; name?: string; description?: string; image?: string } } };
  navigation: any;
};

export default function ServiceDetailScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const item = route?.params?.item ?? {};
  const serviceId = (item as any)?._id || (item as any)?.id;
  const title = item.title ?? (item as any).name ?? 'Servicio';
  const description = item.description ?? '';
  const image = item.image ?? null;

  type Review = {
    _id: string;
    user?: { name?: string };
    rating: number;
    comment?: string;
    createdAt: string;
    serviceId?: string;
    orderId?: string;
    order?: any;
  };

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!API) throw new Error('Configura la URL del backend');
        setLoadingReviews(true);
        setReviewsError(null);
        const res: any = await ReviewsApi(API).listAll();
        const list: Review[] = Array.isArray(res) ? res : (res?.reviews || res?.data || []);

        const filtered = serviceId
          ? list.filter((r: any) => {
            if (r?.serviceId && String(r.serviceId) === String(serviceId)) return true;
            if (r?.order?.serviceId && String(r.order.serviceId) === String(serviceId)) return true;
            if (Array.isArray(r?.order?.items)) {
              return r.order.items.some((it: any) =>
                String(it?.id_servicio?._id || it?.id_servicio?.id || it?.serviceId || it?.service?._id || it?.service?.id || '') === String(serviceId)
              );
            }
            return false;
          })
          : list;

        if (mounted) setReviews(filtered);
      } catch (e) {
        if (mounted) setReviewsError((e as Error)?.message || 'No se pudieron cargar las reseñas');
      } finally {
        if (mounted) setLoadingReviews(false);
      }
    })();
    return () => { mounted = false; };
  }, [serviceId]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const avg = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length;
    return Math.round(avg * 10) / 10;
  }, [reviews]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <FloatingCartButton top={10} left={10} />
      {image && <Image source={{ uri: image }} style={styles.hero} resizeMode="cover" />}

      <View style={styles.headerRow}>
        <View style={[styles.iconBubble, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="cube-outline" size={20} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      </View>

      <Text style={[styles.paragraph, { color: theme.colors.muted }]}>{description}</Text>

      {/* Etiquetas / categorías */}
      <View style={styles.chipsRow}>
        {['Tapicería', 'Personalizado', 'Sala'].map((c) => (
          <View key={c} style={[styles.chip, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.chipText, { color: theme.colors.primary }]}>{c}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.section, { color: theme.colors.text }]}>Caracteristicas</Text>
      {['Diseño 100% personalizado', 'Selección de materiales', 'Asesoría y visualización previa'].map((f) => (
        <View key={f} style={styles.featureRow}>
          <Ionicons name="ellipse" size={8} color={theme.colors.primary} />
          <Text style={[styles.featureText, { color: theme.colors.muted }]}>{f}</Text>
        </View>
      ))}

      {/* Información útil */}
      <View style={styles.infoRow}>
        <View style={[styles.infoBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <Text style={[styles.infoTitle, { color: theme.colors.muted }]}>Tiempo estimado</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>3 - 5 días</Text>
        </View>
        <View style={[styles.infoBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <Text style={[styles.infoTitle, { color: theme.colors.muted }]}>Garantía</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>6 meses</Text>
        </View>
      </View>

      {/* Galería secundaria */}
      {image && (
        <>
          <Text style={[styles.section, { color: theme.colors.text }]}>Galería</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {[image, image, image].map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.thumb} />
            ))}
          </ScrollView>
        </>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => navigation.navigate('Schedule', { item: { title } })}>
          <Text style={styles.btnText}>Agendar cita</Text>
        </TouchableOpacity>
      </View>

      {/* Reseñas */}
      <View style={styles.reviewsHeader}>
        <Text style={[styles.section, { color: theme.colors.text }]}>Reseñas</Text>
        {averageRating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={16} color={theme.colors.warning} />
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
      ) : reviewsError ? (
        <View style={[styles.emptyReviews, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
          <Ionicons name="alert-circle-outline" size={42} color={theme.colors.danger} />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>No pudimos cargar reseñas</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.muted }]}>{reviewsError}</Text>
        </View>
      ) : reviews.length === 0 ? (
        <View style={[styles.emptyReviews, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
          <Ionicons name="chatbox-outline" size={48} color={theme.colors.muted} />
          <Text style={[styles.emptyText, { color: theme.colors.muted }]}>Aún no hay reseñas</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.muted }]}>Sé el primero en calificar este servicio</Text>
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
                    color={star <= review.rating ? theme.colors.warning : theme.colors.muted}
                  />
                ))}
              </View>
              <Text style={[styles.reviewDate, { color: theme.colors.muted }]}> 
                {new Date(review.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            {!!review.comment && (
              <Text style={[styles.reviewComment, { color: theme.colors.text }]}>{review.comment}</Text>
            )}
            {!!review.user?.name && (
              <Text style={[styles.reviewAuthor, { color: theme.colors.muted }]}>— {review.user.name}</Text>
            )}
          </View>
        ))
      )}

      <TouchableOpacity
        style={[styles.reviewBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => {
          // Las reseñas actualmente están asociadas a pedidos (/api/orders/:id/reviews).
          // Para calificar, el usuario debe entrar a un pedido y dejar la reseña desde allí.
          const parent: any = navigation?.getParent?.();
          if (parent?.navigate) {
            parent.navigate('Mis pedidos');
          } else {
            navigation.navigate('OrdersHome' as any);
          }
        }}
      >
        <Ionicons name="star-outline" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
        <Text style={[styles.reviewBtnText, { color: theme.colors.primary }]}>Dejar reseña</Text>
      </TouchableOpacity>

      {/* Contacto */}
      <View style={styles.contactRow}>
        <TouchableOpacity style={styles.contactBtn}><Text style={styles.contactText}>WhatsApp</Text></TouchableOpacity>
        <TouchableOpacity style={styles.contactBtn}><Text style={styles.contactText}>Llamar</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { width: '100%', height: 220 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginTop: 12 },
  iconBubble: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 16, fontWeight: '800' },
  paragraph: { paddingHorizontal: 16, marginTop: 12, lineHeight: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  chip: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1 },
  chipText: { fontWeight: '700', fontSize: 12 },
  section: { paddingHorizontal: 16, marginTop: 16, fontWeight: '800' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 8 },
  featureText: {},
  infoRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16 },
  infoBox: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12 },
  infoTitle: { fontSize: 12 },
  infoValue: { fontWeight: '800', marginTop: 4 },
  thumb: { width: 140, height: 90, borderRadius: 10 },
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 20 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#6b4028' },
  btnGhost: { borderWidth: 1 },
  btnText: { color: '#fff', fontWeight: '800' },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 16 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontWeight: '800', fontSize: 16 },
  reviewCount: { fontSize: 14 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  loadingText: { fontSize: 14 },
  emptyReviews: { marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { fontWeight: '700', fontSize: 16, marginTop: 12 },
  emptySubtext: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  reviewCard: { marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: 12 },
  reviewComment: { lineHeight: 20, marginBottom: 8 },
  reviewAuthor: { fontSize: 12, fontStyle: 'italic' },
  reviewBtn: { marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderRadius: 14, alignItems: 'center', paddingVertical: 12, flexDirection: 'row', justifyContent: 'center' },
  reviewBtnText: { fontWeight: '800' },
  contactRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16 },
  contactBtn: { flex: 1, backgroundColor: '#6b4028', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  contactText: { color: '#fff', fontWeight: '800' },
});


