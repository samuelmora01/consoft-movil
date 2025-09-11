import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  route: { params?: { item?: { title?: string; description?: string; image?: string } } };
  navigation: any;
};

export default function ServiceDetailScreen({ route, navigation }: Props) {
  const item = route?.params?.item ?? {};
  const title = item.title ?? 'Servicio';
  const description =
    item.description ??
    'Transformamos tus muebles con tapicería de alta calidad. Nuestro equipo te ayuda a elegir telas y diseños únicos que reflejen tu estilo personal.';
  const image =
    item.image ??
    'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=1200&auto=format&fit=crop';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Image source={{ uri: image }} style={styles.hero} resizeMode="cover" />

      <View style={styles.headerRow}>
        <View style={styles.iconBubble}>
          <Ionicons name="cube-outline" size={20} color="#6b4028" />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      <Text style={styles.paragraph}>{description}</Text>

      {/* Etiquetas / categorías */}
      <View style={styles.chipsRow}>
        {['Tapicería', 'Personalizado', 'Sala'].map((c) => (
          <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
        ))}
      </View>

      <Text style={styles.section}>Caracteristicas</Text>
      {['Diseño 100% personalizado', 'Selección de materiales', 'Asesoría y visualización previa'].map((f) => (
        <View key={f} style={styles.featureRow}>
          <Ionicons name="ellipse" size={8} color="#6b4028" />
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}

      {/* Información útil */}
      <View style={styles.infoRow}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Tiempo estimado</Text>
          <Text style={styles.infoValue}>3 - 5 días</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Garantía</Text>
          <Text style={styles.infoValue}>6 meses</Text>
        </View>
      </View>

      {/* Galería secundaria */}
      <Text style={styles.section}>Galería</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {[image, image, image].map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.thumb} />
        ))}
      </ScrollView>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => navigation.navigate('Schedule', { item: { title } })}>
          <Text style={styles.btnText}>Agendar cita</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => { /* placeholder calificar */ }}>
          <Text style={[styles.btnText, { color: '#6b4028' }]}>Califícanos</Text>
        </TouchableOpacity>
      </View>

      {/* Preguntas frecuentes */}
      <Text style={styles.section}>Preguntas frecuentes</Text>
      <View style={styles.faqCard}>
        <Text style={styles.faqQ}>¿Puedo llevar mi propia tela?</Text>
        <Text style={styles.faqA}>Sí, trabajamos con tu material o te asesoramos para escoger el ideal.</Text>
      </View>
      <View style={styles.faqCard}>
        <Text style={styles.faqQ}>¿Recogen y entregan a domicilio?</Text>
        <Text style={styles.faqA}>Ofrecemos servicio a domicilio en áreas seleccionadas. Consulta disponibilidad.</Text>
      </View>

      {/* Contacto */}
      <View style={styles.contactRow}>
        <TouchableOpacity style={styles.contactBtn}><Text style={styles.contactText}>WhatsApp</Text></TouchableOpacity>
        <TouchableOpacity style={styles.contactBtn}><Text style={styles.contactText}>Llamar</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hero: { width: '100%', height: 220 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginTop: 12 },
  iconBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#efe7e2', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: '#2d2420' },
  paragraph: { paddingHorizontal: 16, marginTop: 12, color: '#4c3d32', lineHeight: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  chip: { backgroundColor: '#efe7e2', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  chipText: { color: '#6b4028', fontWeight: '700', fontSize: 12 },
  section: { paddingHorizontal: 16, marginTop: 16, fontWeight: '800', color: '#2d2420' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 8 },
  featureText: { color: '#4c3d32' },
  infoRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16 },
  infoBox: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6ded8', borderRadius: 14, padding: 12 },
  infoTitle: { color: '#6f635b', fontSize: 12 },
  infoValue: { color: '#2d2420', fontWeight: '800', marginTop: 4 },
  thumb: { width: 140, height: 90, borderRadius: 10 },
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 20 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#6b4028' },
  btnGhost: { backgroundColor: '#efe7e2' },
  btnText: { color: '#fff', fontWeight: '800' },
  faqCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6ded8', borderRadius: 12, padding: 12 },
  faqQ: { fontWeight: '800', color: '#2d2420', marginBottom: 6 },
  faqA: { color: '#4c3d32', lineHeight: 18 },
  contactRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16 },
  contactBtn: { flex: 1, backgroundColor: '#6b4028', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  contactText: { color: '#fff', fontWeight: '800' },
});


