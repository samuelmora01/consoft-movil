import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { ReviewsApi } from '../api/client';
import { API } from '../config';

type Props = {
  route: { params?: { orderId?: string; orderTitle?: string } };
  navigation: any;
};

export default function ServiceReviewScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const orderId = route?.params?.orderId;
  const orderTitle = route?.params?.orderTitle || 'Pedido';
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Calificación requerida', 'Por favor selecciona una calificación de 1 a 5 estrellas');
      return;
    }

    if (!orderId) {
      Alert.alert('Error', 'No se pudo identificar el pedido');
      return;
    }

    try {
      setSubmitting(true);
      if (!API) throw new Error('Configura la URL del backend');
      
      await ReviewsApi(API).create(orderId, {
        rating,
        comment: comment.trim() ? comment.trim() : undefined,
      });

      Alert.alert(
        '¡Gracias!',
        'Tu reseña ha sido enviada correctamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', (e as Error)?.message || 'No se pudo enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Ionicons name="star" size={32} color="#F6C453" />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Califica tu pedido</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.muted }]}>{orderTitle}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Tu calificación</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={48}
                color={star <= rating ? '#F6C453' : theme.colors.muted}
              />
            </TouchableOpacity>
          ))}
        </View>
        {rating > 0 && (
          <Text style={[styles.ratingText, { color: theme.colors.muted }]}>
            {rating === 1 && 'Muy malo'}
            {rating === 2 && 'Malo'}
            {rating === 3 && 'Regular'}
            {rating === 4 && 'Bueno'}
            {rating === 5 && 'Excelente'}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Tu comentario</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Cuéntanos sobre tu experiencia (opcional)"
          placeholderTextColor={theme.colors.muted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={[
            styles.commentInput,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
        />
        <Text style={[styles.charCount, { color: theme.colors.muted }]}>
          {comment.length} caracteres
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: theme.colors.primary, opacity: submitting || rating === 0 ? 0.5 : 1 },
        ]}
        onPress={handleSubmit}
        disabled={submitting || rating === 0}
      >
        <Text style={styles.submitText}>
          {submitting ? 'Enviando...' : 'Enviar reseña'}
        </Text>
        {!submitting && <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', marginTop: 12 },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  section: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  starButton: { padding: 4 },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    fontSize: 15,
  },
  charCount: { fontSize: 12, marginTop: 6, textAlign: 'right' },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
