import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Modal, Pressable, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../store/userStore';
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
    image: 'https://images.unsplash.com/photo-1520881363902-a0ff4e722963?q=80&w=1200&auto=format&fit=crop',
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
  const contact = useUserStore((s) => s.contact);
  const [segment, setSegment] = useState<'servicios' | 'productos'>('productos');
  const [warnContactModal, setWarnContactModal] = useState(false);
  const [query, setQuery] = useState('');
  const [price, setPrice] = useState('');
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const FURNITURE_TYPES = ['Mueble', 'Sillón', 'Sofá', 'Sofá cama', 'Cama', 'Mesa'];
  // Price modal state
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedBands, setSelectedBands] = useState<string[]>([]);
  const PRICE_BANDS = ['90.000COP - 100.000', '100.000COP - 200.000', '200.000COP - 300.000'];

  const toggleBand = (name: string) => {
    setSelectedBands((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const toggleType = (name: string) => {
    setSelectedTypes((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const data = useMemo(() => SAMPLE_DATA, []);
  // Service tags removed per design

  const favoriteItems = useFavoritesStore((s) => s.items);
  const favoriteIds = useMemo(() => favoriteItems.map((it) => it.id), [favoriteItems]);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const renderItem = ({ item }: { item: CatalogItem }) => {
    const isSaved = favoriteIds.includes(item.id);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => navigation.navigate('ProductDetail', { item })}>
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.material}</Text>
          <TouchableOpacity style={styles.bookmark} onPress={() => toggleFavorite(item)}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={isSaved ? '#F6C453' : '#6b5a4a'} />
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
        <TouchableOpacity
          style={styles.ctaLight}
          onPress={() => {
            if (!contact?.backupEmail || !contact?.backupPhone || !contact?.defaultAddress) {
              setWarnContactModal(true);
            } else {
              navigation.navigate('Schedule', { item: { title: 'Agendar visita' } });
            }
          }}
        >
          <Ionicons name="calendar-outline" size={16} color="#fff" />
          <Text style={styles.ctaLightText}>Quiero agendar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[
            styles.segment,
            styles.segmentLeft,
            segment === 'servicios' ? styles.segmentActive : undefined,
            segment === 'servicios' ? styles.segmentOnTop : styles.segmentBehind,
          ]}
          onPress={() => setSegment('servicios')}
        >
          <Text style={[styles.segmentText, segment === 'servicios' && styles.segmentTextActive]}>servicios</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segment,
            styles.segmentRight,
            segment === 'productos' ? styles.segmentActive : undefined,
            segment === 'productos' ? styles.segmentOnTop : styles.segmentBehind,
          ]}
          onPress={() => setSegment('productos')}
        >
          <Text style={[styles.segmentText, segment === 'productos' && styles.segmentTextActive]}>Productos</Text>
        </TouchableOpacity>
      </View>

      {segment === 'productos' ? (
        <>
          <TouchableOpacity style={styles.inputRow} activeOpacity={0.8} onPress={() => setTypeModalVisible(true)}>
            <Ionicons name="search-outline" size={18} color="#9b8c7f" />
            <Text style={{ flex: 1, marginHorizontal: 8, color: selectedTypes.length ? '#111827' : '#9b8c7f' }}>
              {selectedTypes.length ? selectedTypes.join(', ') : '¿Qué tipo de mueble buscas?'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#9b8c7f" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.inputRow} activeOpacity={0.8} onPress={() => setPriceModalVisible(true)}>
            <Ionicons name="pricetag-outline" size={18} color="#9b8c7f" />
            <Text style={{ flex: 1, marginHorizontal: 8, color: priceMin || priceMax || selectedBands.length ? '#111827' : '#9b8c7f' }}>
              {priceMin || priceMax
                ? `${priceMin || 'min'} - ${priceMax || 'max'}`
                : selectedBands.length
                  ? selectedBands.join(', ')
                  : 'Precio'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#9b8c7f" />
          </TouchableOpacity>

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
            extraData={favoriteIds}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <>
          {/* Banner informativo */}

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

      {/* Modal de tipos de mueble (overlay aparece primero, sheet sube después) */}
      <BottomSheet visible={typeModalVisible} onClose={() => setTypeModalVisible(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>¿Qué tipo de Mueble estás buscando?</Text>
          <TouchableOpacity onPress={() => setTypeModalVisible(false)}>
            <Ionicons name="close" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
        {FURNITURE_TYPES.map((t) => {
          const checked = selectedTypes.includes(t);
          return (
            <TouchableOpacity key={t} style={styles.optionRow} onPress={() => toggleType(t)}>
              <View style={[styles.checkbox, checked ? styles.checkboxChecked : styles.checkboxUnchecked]} />
              <Text style={styles.optionLabel}>{t}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.saveBtn} onPress={() => setTypeModalVisible(false)}>
          <Text style={styles.saveBtnText}>Guardar</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Advertencia de contacto incompleto */}
      <Modal visible={warnContactModal} transparent animationType="fade" onRequestClose={() => setWarnContactModal(false)}>
        <View style={styles.centerBackdrop}>
          <View style={styles.warnCard}>
            <Text style={{ fontWeight: '800', color: '#111827', marginBottom: 6 }}>Falta información</Text>
            <Text style={{ color: '#374151', marginBottom: 12 }}>Completa tu información de contacto antes de agendar una cita.</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.warnBtn, styles.warnBtnLight]} onPress={() => setWarnContactModal(false)}>
                <Text style={[styles.warnBtnText, { color: '#111827' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.warnBtn, { backgroundColor: BROWN }]}
                onPress={() => {
                  setWarnContactModal(false);
                  navigation.navigate('ContactInfo');
                }}
              >
                <Text style={styles.warnBtnText}>Completar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de precio */}
      <BottomSheet visible={priceModalVisible} onClose={() => setPriceModalVisible(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>¿Qué tipo de Precio estás buscando?</Text>
          <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
            <Ionicons name="close" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.priceLabel, { color: BROWN }]}>Ingresa el Valor Minimo</Text>
        <TextInput
          value={priceMin}
          onChangeText={setPriceMin}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor="#9AA3AF"
          style={[styles.priceInput, { backgroundColor: '#EEF0F5', borderColor: BROWN }]}
        />

        <Text style={[styles.priceLabel, { marginTop: 8, color: BROWN }]}>Ingresa el Valor Maximo</Text>
        <TextInput
          value={priceMax}
          onChangeText={setPriceMax}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor="#9AA3AF"
          style={[styles.priceInput, { backgroundColor: '#EEF0F5', borderColor: BROWN }]}
        />

        <Text style={[styles.priceLabel, { marginTop: 12, color: BROWN }]}>Precios Estandar</Text>
        {PRICE_BANDS.map((b) => {
          const checked = selectedBands.includes(b);
          return (
            <TouchableOpacity key={b} style={styles.optionRow} onPress={() => toggleBand(b)}>
              <View style={[styles.checkbox, checked ? styles.checkboxChecked : styles.checkboxUnchecked]} />
              <Text style={styles.optionLabel}>{b}</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.saveBtn} onPress={() => setPriceModalVisible(false)}>
          <Text style={styles.saveBtnText}>Guardar</Text>
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
}

const BROWN = '#6b4028';
const LIGHT = '#f3ece7';
const LILAC = '#EDE9FE';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16 },
  headerBar: { marginHorizontal: -20, paddingHorizontal: 20, backgroundColor: '#F3F4F6', height: 64, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  brand: { color: '#111827', fontWeight: '800', fontSize: 18 },
  ctaLight: { backgroundColor: BROWN, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, flexDirection: 'row', alignItems: 'center' },
  ctaLightText: { color: '#fff', fontWeight: '700', marginLeft: 6 },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    padding: 6,
    borderRadius: 22,
    alignSelf: 'center',
    gap: 0,
    marginBottom: 16,
    width: '94%',
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, backgroundColor: LILAC },
  segmentActive: { backgroundColor: BROWN },
  segmentLeft: { marginRight: -12 },
  segmentRight: { marginLeft: -12 },
  segmentOnTop: { zIndex: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  segmentBehind: { zIndex: 0 },
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
  // chips removed
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fde68a', padding: 10, borderRadius: 12, marginBottom: 10 },
  infoBannerText: { color: '#92400e', fontWeight: '600' },
  // Bottom sheet modal styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  backdropClickable: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, gap: 12, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  optionLabel: { color: '#111827', fontWeight: '600' },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 1 },
  checkboxUnchecked: { borderColor: '#C7C7C7', backgroundColor: '#fff' },
  checkboxChecked: { borderColor: '#6b4028', backgroundColor: '#F4EFFF' },
  priceLabel: { fontWeight: '700' },
  priceInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  saveBtn: { marginTop: 8, alignSelf: 'center', width: '86%', backgroundColor: '#6b4028', borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  centerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  warnCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '90%' },
  warnBtn: { flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  warnBtnLight: { backgroundColor: '#e5e7eb' },
  warnBtnText: { color: '#fff', fontWeight: '700' },
});


// Simple bottom sheet with overlay-first animation
function BottomSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const translateY = React.useRef(new Animated.Value(400)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      translateY.setValue(400);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' }}>
      <Pressable style={{ ...StyleSheet.absoluteFillObject }} onPress={onClose}>
        <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', opacity }} />
      </Pressable>
      <Animated.View style={[styles.modalSheet, { transform: [{ translateY }] }]}> 
        {children}
      </Animated.View>
    </View>
  );
}

