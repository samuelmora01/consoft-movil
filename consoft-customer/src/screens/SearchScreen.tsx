import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavoritesStore } from '../store/favoritesStore';

type CatalogItem = {
  id: string;
  title: string;
  material: string;
  image: string;
};

const SAMPLE_DATA: CatalogItem[] = Array.from({ length: 8 }).map((_, i) => ({
  id: String(i + 1),
  title: 'Mueble 2 espacios',
  material: 'Cuero · cuerina',
  image: 'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=1200&auto=format&fit=crop',
}));

type ServiceItem = {
  id: string;
  title: string;
  description: string;
  image: string;
};

const SERVICES_DATA: ServiceItem[] = [
  {
    id: 's1',
    title: 'Tapizado personalizado',
    description: 'Personalizamos tus muebles con telas y colores a tu gusto',
    image: 'https://images.unsplash.com/photo-1616596874499-80b1b88e33b9?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 's2',
    title: 'Restauración de muebles',
    description: 'Reparamos y decoramos a la vida antigua y muebles antiguos',
    image: 'https://images.unsplash.com/photo-1520881363902-a0ff4e722963?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 's3',
    title: 'Fabricación a medida',
    description: 'Creamos muebles a la medida con acabados de alta calidad',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
  },
];

export default function SearchScreen({ navigation }: any) {
  const [segment, setSegment] = useState<'servicios' | 'productos'>('productos');
  const [query, setQuery] = useState('');
  const [price, setPrice] = useState('');

  const data = useMemo(() => SAMPLE_DATA, []);
  const SERVICE_TAGS = ['Tapicería', 'Restauración', 'Fabricación', 'Mantenimiento'];

  const savedChecker = useFavoritesStore((s) => s.isSaved);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const renderItem = ({ item }: { item: CatalogItem }) => {
    const isSaved = savedChecker(item.id);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => navigation.navigate('ProductDetail', { item })}>
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.material}</Text>
          <TouchableOpacity style={styles.bookmark} onPress={() => toggleFavorite(item)}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={isSaved ? '#6b4028' : '#6b5a4a'} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderService = ({ item }: { item: ServiceItem }) => {
    return (
      <TouchableOpacity style={styles.serviceCard} activeOpacity={0.9} onPress={() => navigation.navigate('ServiceDetail', { item })}>
        <Image source={{ uri: item.image }} style={styles.serviceImage} resizeMode="cover" />
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceTitle}>{item.title}</Text>
          <Text style={styles.serviceDesc}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.brand}>Consoft</Text>
        <TouchableOpacity style={styles.ctaLight} onPress={() => navigation.navigate('Schedule', { item: { title: 'Agendar visita' } })}>
          <Ionicons name="calendar-outline" size={16} color={BROWN} />
          <Text style={styles.ctaLightText}>Quiero agendar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segment, segment === 'servicios' && styles.segmentActive]}
          onPress={() => setSegment('servicios')}
        >
          <Text style={[styles.segmentText, segment === 'servicios' && styles.segmentTextActive]}>servicios</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, segment === 'productos' && styles.segmentActive]}
          onPress={() => setSegment('productos')}
        >
          <Text style={[styles.segmentText, segment === 'productos' && styles.segmentTextActive]}>Productos</Text>
        </TouchableOpacity>
      </View>

      {segment === 'productos' ? (
        <>
          <View style={styles.inputRow}>
            <Ionicons name="search-outline" size={18} color="#9b8c7f" />
            <TextInput
              style={styles.input}
              placeholder="¿Qué tipo de mueble buscas?"
              placeholderTextColor="#9b8c7f"
              value={query}
              onChangeText={setQuery}
            />
            <Ionicons name="chevron-forward" size={18} color="#9b8c7f" />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="pricetag-outline" size={18} color="#9b8c7f" />
            <TextInput
              style={styles.input}
              placeholder="Precio"
              placeholderTextColor="#9b8c7f"
              value={price}
              onChangeText={setPrice}
            />
            <Ionicons name="chevron-forward" size={18} color="#9b8c7f" />
          </View>

          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchText}>Buscar</Text>
            <Ionicons name="search-outline" size={16} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={{ gap: 16 }}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <>
          {/* Chips de categorías */}
          <View style={styles.serviceChipsRow}>
            {SERVICE_TAGS.map((t) => (
              <View key={t} style={styles.serviceChip}><Text style={styles.serviceChipText}>{t}</Text></View>
            ))}
          </View>

          {/* Banner informativo */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={BROWN} />
            <Text style={styles.infoBannerText}>Asesoría gratuita para elegir telas y materiales</Text>
          </View>

          <FlatList
            data={SERVICES_DATA}
            keyExtractor={(item) => item.id}
            renderItem={renderService}
            ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
            contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const BROWN = '#6b4028';
const LIGHT = '#f3ece7';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16 },
  headerBar: { marginHorizontal: -20, paddingHorizontal: 20, backgroundColor: BROWN, height: 64, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  brand: { color: '#fff', fontWeight: '800', fontSize: 18 },
  ctaLight: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, flexDirection: 'row', alignItems: 'center' },
  ctaLightText: { color: BROWN, fontWeight: '700', marginLeft: 6 },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: LIGHT,
    padding: 6,
    borderRadius: 16,
    alignSelf: 'center',
    gap: 6,
    marginBottom: 14,
  },
  segment: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  segmentActive: { backgroundColor: BROWN },
  segmentText: { color: '#7a6a5d', fontWeight: '600' },
  segmentTextActive: { color: '#fff' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6ded8',
    borderRadius: 22,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  input: { flex: 1, marginHorizontal: 8, color: '#333' },

  searchButton: {
    alignSelf: 'center',
    width: '100%',
    backgroundColor: BROWN,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  searchText: { color: '#fff', fontWeight: '700' },

  grid: { paddingBottom: 24, gap: 16 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardImage: { width: '100%', height: 120 },
  cardBody: { padding: 12, position: 'relative' },
  cardTitle: { fontWeight: '700', marginBottom: 6 },
  cardSubtitle: { color: '#8a7c70', fontSize: 12 },
  bookmark: { position: 'absolute', right: 10, top: -20, backgroundColor: '#fff', padding: 6, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },

  // Services list styles
  serviceCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e6ded8',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  serviceImage: { width: 120, height: 80, borderRadius: 12 },
  serviceTitle: { fontWeight: '800', marginBottom: 6, color: '#2d2420', fontSize: 14 },
  serviceDesc: { color: '#6f635b', fontSize: 12 },
  serviceChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 8 },
  serviceChip: { backgroundColor: LIGHT, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  serviceChipText: { color: BROWN, fontWeight: '700', fontSize: 12 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fde68a', padding: 10, borderRadius: 12, marginBottom: 10 },
  infoBannerText: { color: '#92400e', fontWeight: '600' },
});


