import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useAppStore } from '../../../store/appStore';
import { Review } from '../../../domain/types';
import { Image } from 'expo-image';
import { moderateScale, responsiveFontSize, scale } from '../../../theme/responsive';
import { Ionicons } from '@expo/vector-icons';

export default function ReviewsScreen() {
  const { theme } = useTheme();
  const reviews = useAppStore((s) => s.reviews);
  const seedReviews = useAppStore((s) => s.seedReviews);
  const removeReview = useAppStore((s) => s.removeReview);
  const [sort, setSort] = useState<'recent' | 'top'>('recent');
  const average = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }, [reviews]);
  const rounded = Math.round(average);

  useEffect(() => {
    if (reviews.length === 0) {
      seedReviews();
    }
  }, [reviews.length, seedReviews]);

  const ordered = useMemo(() => {
    if (sort === 'top') return [...reviews].sort((a, b) => b.rating - a.rating);
    return [...reviews].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [reviews, sort]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }] }>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: responsiveFontSize(18) }]}>Reseñas</Text>
      <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderRadius: theme.radius, padding: moderateScale(12) }]}> 
        <Text style={[styles.cardTitle, { color: theme.colors.text, fontSize: responsiveFontSize(14) }]}>Promedio</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons key={i} name={i < rounded ? 'star' : 'star-outline'} size={moderateScale(18)} color={i < rounded ? '#F5B301' : theme.colors.muted} />
          ))}
          <Text style={{ marginLeft: 8, color: theme.colors.muted, fontSize: responsiveFontSize(12) }}>{average.toFixed(1)} de 5 • {reviews.length} reseñas</Text>
        </View>
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity onPress={() => setSort('recent')} style={[styles.filterBtn, sort === 'recent' && { backgroundColor: theme.colors.primary }]}>
          <Text style={{ color: sort === 'recent' ? '#fff' : theme.colors.text }}>Más recientes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSort('top')} style={[styles.filterBtn, sort === 'top' && { backgroundColor: theme.colors.primary }]}>
          <Text style={{ color: sort === 'top' ? '#fff' : theme.colors.text }}>Mejor valoradas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={ordered}
        keyExtractor={(r: Review) => r.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ color: theme.colors.muted }}>Aún no hay reseñas</Text>
          </View>
        }
        renderItem={({ item: r }) => (
          <View style={[styles.reviewCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderRadius: theme.radius, padding: moderateScale(12) }]}> 
            <View style={{ width: scale(48), height: scale(48), borderRadius: theme.radius, backgroundColor: '#D9D9D9', marginRight: 12, overflow: 'hidden' }}>
              {r.avatarUrl ? <Image source={{ uri: r.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: theme.colors.text, fontSize: responsiveFontSize(14) }}>{r.clientName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons key={i} name={i < r.rating ? 'star' : 'star-outline'} size={moderateScale(16)} color={i < r.rating ? '#F5B301' : theme.colors.muted} />
                ))}
              </View>
              <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(12) }}>{r.comment}</Text>
            </View>
            <TouchableOpacity onPress={() => removeReview(r.id)} style={[styles.deleteBtn, { borderColor: theme.colors.border }]}>
              <Ionicons name="trash" size={16} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  summaryCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12 },
  cardTitle: { fontWeight: '700', marginBottom: 8 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  reviewCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#0000' },
  deleteBtn: { width: 36, height: 36, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});


