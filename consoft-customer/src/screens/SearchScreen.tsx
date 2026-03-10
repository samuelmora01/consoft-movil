import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Modal, Pressable, Animated, Easing, ActivityIndicator, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../store/userStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { API } from '../config';
import { ProductsApi, ServicesApi, UsersApi } from '../api/client';
import FloatingCartButton from '../components/FloatingCartButton';
import { useTheme } from '../theme/theme';

type CatalogItem = {
  id: string;
  title: string;
  material: string;
  image?: string | null;
  price?: number | null;
};

type ServiceItem = {
  id: string;
  title: string;
  description: string;
  image?: string | null;
};

export default function SearchScreen({ navigation }: any) {
  const { theme } = useTheme();
  const contact = useUserStore((s) => s.contact);
  const setContact = useUserStore((s) => s.setContact);
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

  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const pickArray = (res: any, keys: string[]) => {
    for (const k of keys) {
      const v = res?.[k];
      if (Array.isArray(v)) return v;
    }
    const data = res?.data;
    if (Array.isArray(data)) return data;
    for (const k of keys) {
      const v = data?.[k];
      if (Array.isArray(v)) return v;
    }
    const items = res?.items;
    if (Array.isArray(items)) return items;
    const dataItems = data?.items;
    if (Array.isArray(dataItems)) return dataItems;
    return Array.isArray(res) ? res : [];
  };

  const pickImageUrl = (obj: any): string | null => {
    const candidate =
      obj?.imageUrl ||
      obj?.image ||
      obj?.featuredImage ||
      (Array.isArray(obj?.images) ? obj.images[0] : undefined);
    if (!candidate) return null;
    if (typeof candidate !== 'string') return candidate?.url || candidate?.uri || null;
    if (candidate.startsWith('blob:')) return null;
    return candidate;
  };

  const parsePriceBand = (band: string): { min?: number; max?: number } => {
    // Example: "90.000COP - 100.000" or "90.000 - 100.000"
    const parts = String(band).split('-').map((p) => p.trim());
    const toNum = (s: string) => {
      const digits = s.replace(/[\D]/g, '');
      const n = digits ? Number(digits) : NaN;
      return Number.isFinite(n) ? n : undefined;
    };
    return { min: parts[0] ? toNum(parts[0]) : undefined, max: parts[1] ? toNum(parts[1]) : undefined };
  };

  const loadCatalog = async () => {
    if (!API) {
      setProducts([]);
      setServices([]);
      setError('Configura la URL del backend');
      return;
    }
    setLoading(true);
    
    try {
      console.log('� Loading catalog from:', API);
      
      // Cargar productos - simple y directo
      const prodsRes = await ProductsApi(API).list();
      console.log('✅ Products loaded');
      
      const prodsList: any[] = pickArray(prodsRes, ['products', 'result', 'rows']);
      const mappedP: CatalogItem[] = prodsList
        .map((p: any, idx: number) => ({
          id: p._id || p.id || String(idx),
          title: p.name || p.title || '',
          material: p.material || p.category?.name || p.subtitle || '',
          image: pickImageUrl(p),
          price: p.price != null ? Number(p.price) : null,
        }))
        .filter((p) => Boolean(p.id) && Boolean(p.title));
      
      setProducts(mappedP);
      
      // Cargar servicios - simple y directo
      const servRes = await ServicesApi(API).list();
      console.log('✅ Services loaded');
      
      const servList: any[] = pickArray(servRes, ['services', 'result', 'rows']);
      const mappedS: ServiceItem[] = servList
        .map((s: any, idx: number) => ({
          id: s._id || s.id || String(idx),
          title: s.name || s.title || '',
          description: s.description || '',
          image: pickImageUrl(s),
        }))
        .filter((s) => Boolean(s.id) && Boolean(s.title));
      
      setServices(mappedS);
      
      setError(null);
      console.log('✅ Catalog loaded successfully');
    } catch (e) {
      console.error('❌ Catalog loading error:', e);
      setError((e as Error)?.message || 'No se pudo cargar catálogo');
      setProducts([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Recargar cuando cambia el segmento si no hay datos
  useEffect(() => {
    if (segment === 'productos' && products.length === 0) {
      loadCatalog();
    } else if (segment === 'servicios' && services.length === 0) {
      loadCatalog();
    }
  }, [segment]);

  // Debounce para búsqueda de texto
  const debouncedSearch = useCallback(
    useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (searchQuery.trim()) {
            runProductSearch();
          } else if (segment === 'productos') {
            loadCatalog(); // Recargar productos si se borra la búsqueda
          }
        }, 500); // 500ms de debounce
      };
    }, [segment]),
    []
  );

  // Ejecutar búsqueda cuando cambia el query
  useEffect(() => {
    if (segment === 'productos') {
      debouncedSearch(query);
    }
  }, [query, segment, debouncedSearch]);
  async function runProductSearch() {
    try {
      if (!API) {
        setError('Configura la URL del backend');
        return;
      }
      setLoading(true);
      // Infer numeric ranges either from min/max inputs or selected bands like "90.000COP - 100.000"
      let minPriceNum: number | undefined = priceMin ? Number(String(priceMin).replace(/[^\d]/g, '')) : undefined;
      let maxPriceNum: number | undefined = priceMax ? Number(String(priceMax).replace(/[^\d]/g, '')) : undefined;
      if ((!minPriceNum || !maxPriceNum) && selectedBands.length) {
        const { min, max } = parsePriceBand(selectedBands[0]);
        minPriceNum = minPriceNum ?? min;
        maxPriceNum = maxPriceNum ?? max;
      }
      const params: Record<string, unknown> = {};
      
      // Agregar query de búsqueda si existe
      if (query.trim()) {
        params.search = query.trim();
        params.q = query.trim();
        params.query = query.trim();
      }
      
      if (selectedTypes.length) {
        params.types = selectedTypes;
        // synonyms
        params.type = selectedTypes;
        params.category = selectedTypes;
      }
      if (minPriceNum != null) {
        params.minPrice = minPriceNum;
        params.min = minPriceNum;
      }
      if (maxPriceNum != null) {
        params.maxPrice = maxPriceNum;
        params.max = maxPriceNum;
      }
      const res = await ProductsApi(API).list(params);
      const prodsList: any[] = pickArray(res, ['products', 'result', 'rows']);
      const mappedP: CatalogItem[] = prodsList.map((p: any, idx: number) => ({
        id: p._id || p.id || String(idx),
        title: p.name || p.title || '',
        material: p.material || p.category?.name || p.subtitle || '',
        image: pickImageUrl(p),
        price: p.price != null ? Number(p.price) : null,
      })).filter((p) => Boolean(p.id) && Boolean(p.title));
      setProducts(mappedP);
      setError(null);
    } catch (e) {
      setError((e as Error)?.message || 'No se pudo filtrar productos');
    } finally {
      setLoading(false);
    }
  }
  const data = useMemo(() => products, [products]);
  // Service tags removed per design

  const favoriteItems = useFavoritesStore((s) => s.items);
  const favoriteIds = useMemo(() => favoriteItems.map((it) => it.id), [favoriteItems]);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const renderItem = ({ item }: { item: CatalogItem }) => {
  const isSaved = favoriteIds.includes(item.id);
  
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id, from: 'search', item })}
    >
      {item.image ? (
        <Image 
          source={{ uri: item.image }} 
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: theme.colors.border }]}>
          <Ionicons name="cube-outline" size={32} color={theme.colors.muted} />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.cardSubtitle, { color: theme.colors.muted }]} numberOfLines={1}>
          {item.material}
        </Text>
        {item.price != null && (
          <Text style={[styles.cardPrice, { color: theme.colors.primary }]}>
            ${item.price.toLocaleString('es-CO')}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.bookmark, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => {
          const favoriteItem = {
            id: item.id,
            title: item.title,
            material: item.material,
            image: item.image || ''
          };
          toggleFavorite(favoriteItem);
        }}
      >
        <Ionicons
          name={isSaved ? 'bookmark' : 'bookmark-outline'}
          size={16}
          color={isSaved ? theme.colors.primary : theme.colors.muted}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

  const renderService = ({ item }: { item: ServiceItem }) => {
    return (
      <TouchableOpacity
        style={[styles.serviceCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ServiceDetail', { item })}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.serviceImage} resizeMode="cover" />
        ) : (
          <View style={[styles.serviceImagePlaceholder, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <Ionicons name="image-outline" size={22} color={theme.colors.muted} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.serviceTitle, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.serviceDesc, { color: theme.colors.muted }]}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FloatingCartButton top={10} left={10} />
      <View style={[styles.headerBar, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.brand, { color: theme.colors.text }]}>Consoft</Text>
        <TouchableOpacity
          style={styles.ctaLight}
          onPress={async () => {
            // Si no hay contacto en el store, cargar del perfil
            if (!contact) {
              try {
                const profileData = await UsersApi(API).me();
                const user = (profileData as any)?.user || profileData;
                
                // Mapear campos del perfil al formato del store
                const contactData = {
                  backupEmail: user?.email || '',
                  backupPhone: user?.phone || '',
                  defaultAddress: user?.address || ''
                };
                
                setContact(contactData);
                
                // Validar después de cargar
                const hasEmail = contactData.backupEmail && contactData.backupEmail.trim().length > 0;
                const hasPhone = contactData.backupPhone && contactData.backupPhone.trim().length > 0;
                const hasAddress = contactData.defaultAddress && contactData.defaultAddress.trim().length > 0;
                
                if (!hasEmail || !hasPhone || !hasAddress) {
                  setWarnContactModal(true);
                } else {
                  navigation.navigate('Schedule', { item: { title: 'Agendar visita' } });
                }
              } catch (error) {
                setWarnContactModal(true);
              }
            } else {
              // Validación normal si ya hay contacto
              const hasEmail = contact?.backupEmail && contact.backupEmail.trim().length > 0;
              const hasPhone = contact?.backupPhone && contact.backupPhone.trim().length > 0;
              const hasAddress = contact?.defaultAddress && contact.defaultAddress.trim().length > 0;
              
              if (!hasEmail || !hasPhone || !hasAddress) {
                setWarnContactModal(true);
              } else {
                navigation.navigate('Schedule', { item: { title: 'Agendar visita' } });
              }
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
          <TouchableOpacity
            style={[styles.inputRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
            activeOpacity={0.8}
            onPress={() => setTypeModalVisible(true)}
          >
            <Ionicons name="search-outline" size={18} color={theme.colors.muted} />
            <Text style={{ flex: 1, marginHorizontal: 8, color: selectedTypes.length ? theme.colors.text : theme.colors.muted }}>
              {selectedTypes.length ? selectedTypes.join(', ') : '¿Qué tipo de mueble buscas?'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inputRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
            activeOpacity={0.8}
            onPress={() => setPriceModalVisible(true)}
          >
            <Ionicons name="pricetag-outline" size={18} color={theme.colors.muted} />
            <Text style={{ flex: 1, marginHorizontal: 8, color: priceMin || priceMax || selectedBands.length ? theme.colors.text : theme.colors.muted }}>
              {priceMin || priceMax
                ? `${priceMin || 'min'} - ${priceMax || 'max'}`
                : selectedBands.length
                  ? selectedBands.join(', ')
                  : 'Precio'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.searchButton} onPress={runProductSearch}>
            <Text style={styles.searchText}>Buscar</Text>
            <Ionicons name="search-outline" size={16} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.centerStateText, { color: theme.colors.muted }]}>Cargando productos...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Text style={[styles.centerStateText, { color: theme.colors.muted }]}>{error}</Text>
              <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={() => loadCatalog()}>
                <Ionicons name="refresh" size={16} color={theme.colors.primary} />
                <Text style={[styles.retryText, { color: theme.colors.primary }]}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : data.length === 0 ? (
            <View style={styles.centerState}>
              <Text style={[styles.centerStateText, { color: theme.colors.muted }]}>No hay productos en el catálogo.</Text>
              <TouchableOpacity style={[styles.customProductButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]} onPress={() => navigation.navigate('CustomProduct')}>
                <View style={[styles.customProductIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Ionicons name="hammer-outline" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.customProductContent}>
                  <Text style={[styles.customProductTitle, { color: theme.colors.text }]}>Diseño personalizado</Text>
                  <Text style={[styles.customProductSubtitle, { color: theme.colors.muted }]}>Cuéntanos qué necesitas y te cotizamos</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                style={{ flex: 1 }}
                numColumns={2}
                columnWrapperStyle={{ gap: 12, paddingHorizontal: 8 }}
                contentContainerStyle={styles.grid}
                extraData={favoriteIds}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={() => (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <TouchableOpacity
                      style={[styles.customProductButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}
                      onPress={() => navigation.navigate('CustomProduct')}
                    >
                      <View style={[styles.customProductIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                        <Ionicons name="hammer-outline" size={24} color={theme.colors.primary} />
                      </View>
                      <View style={styles.customProductContent}>
                        <Text style={[styles.customProductTitle, { color: theme.colors.text }]}>¿No encuentras lo que buscas?</Text>
                        <Text style={[styles.customProductSubtitle, { color: theme.colors.muted }]}>Diseña tu mueble ideal y te cotizamos</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
                // SIN OPTIMIZACIONES para probar si causan el problema
              />
            </View>
          )}
        </>
      ) : (
        <>
          {/* Banner informativo */}

          <FlatList
            data={services}
            keyExtractor={(item) => item.id}
            renderItem={renderService}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            // SIN OPTIMIZACIONES para probar si causan el problema
          />
        </>
      )}

      {/* Modal de tipos de mueble */}
      <BottomSheet visible={typeModalVisible} onClose={() => setTypeModalVisible(false)} sheetStyle={{ backgroundColor: theme.colors.card }}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>¿Qué tipo de Mueble estás buscando?</Text>
          <TouchableOpacity onPress={() => setTypeModalVisible(false)}>
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.optionsContainer}>
          {FURNITURE_TYPES.map((t) => {
            const checked = selectedTypes.includes(t);
            return (
              <TouchableOpacity key={t} style={styles.optionRow} onPress={() => toggleType(t)}>
                <View style={[styles.checkbox, checked ? styles.checkboxChecked : styles.checkboxUnchecked]}>
                  {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={[styles.optionLabel, { color: theme.colors.text, fontWeight: checked ? '700' : '600' }]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={() => setTypeModalVisible(false)}>
          <Text style={styles.saveBtnText}>Guardar</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Modal de precio */}
      <BottomSheet visible={priceModalVisible} onClose={() => setPriceModalVisible(false)} sheetStyle={{ backgroundColor: theme.colors.card }}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>¿Qué tipo de Precio estás buscando?</Text>
          <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.optionsContainer}>
          <Text style={[styles.priceLabel, { color: BROWN }]}>Ingresa el Valor Minimo</Text>
          <TextInput
            value={priceMin}
            onChangeText={setPriceMin}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor={theme.colors.muted}
            style={[styles.priceInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
          />

          <Text style={[styles.priceLabel, { marginTop: 8, color: BROWN }]}>Ingresa el Valor Maximo</Text>
          <TextInput
            value={priceMax}
            onChangeText={setPriceMax}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor={theme.colors.muted}
            style={[styles.priceInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
          />

          <Text style={[styles.priceLabel, { marginTop: 12, color: BROWN }]}>Precios Estandar</Text>
          {PRICE_BANDS.map((b) => {
            const checked = selectedBands.includes(b);
            return (
              <TouchableOpacity key={b} style={styles.optionRow} onPress={() => toggleBand(b)}>
                <View style={[styles.checkbox, checked ? styles.checkboxChecked : styles.checkboxUnchecked]} />
                <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{b}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={() => setPriceModalVisible(false)}>
          <Text style={styles.saveBtnText}>Guardar</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Advertencia de contacto incompleto */}
      <Modal visible={warnContactModal} transparent animationType="fade" onRequestClose={() => setWarnContactModal(false)}>
        <View style={styles.centerBackdrop}>
          <View style={[styles.warnCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1 }]}>
            <Text style={{ fontWeight: '800', color: theme.colors.text, marginBottom: 6 }}>Falta información</Text>
            <Text style={{ color: theme.colors.muted, marginBottom: 12 }}>Completa tu información de contacto antes de agendar una cita.</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.warnBtn, styles.warnBtnLight, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderWidth: 1 }]} onPress={() => setWarnContactModal(false)}>
                <Text style={[styles.warnBtnText, { color: theme.colors.text }]}>Cancelar</Text>
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
      <BottomSheet visible={priceModalVisible} onClose={() => setPriceModalVisible(false)} sheetStyle={{ backgroundColor: theme.colors.card }}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>¿Qué tipo de Precio estás buscando?</Text>
          <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.priceLabel, { color: BROWN }]}>Ingresa el Valor Minimo</Text>
        <TextInput
          value={priceMin}
          onChangeText={setPriceMin}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor={theme.colors.muted}
          style={[styles.priceInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
        />

        <Text style={[styles.priceLabel, { marginTop: 8, color: BROWN }]}>Ingresa el Valor Maximo</Text>
        <TextInput
          value={priceMax}
          onChangeText={setPriceMax}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor={theme.colors.muted}
          style={[styles.priceInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
        />

        <Text style={[styles.priceLabel, { marginTop: 12, color: BROWN }]}>Precios Estandar</Text>
        {PRICE_BANDS.map((b) => {
          const checked = selectedBands.includes(b);
          return (
            <TouchableOpacity key={b} style={styles.optionRow} onPress={() => toggleBand(b)}>
              <View style={[styles.checkbox, checked ? styles.checkboxChecked : styles.checkboxUnchecked]} />
              <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{b}</Text>
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  headerBar: { marginHorizontal: -20, paddingHorizontal: 20, height: 64, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1 },
  brand: { fontWeight: '800', fontSize: 18 },
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

  centerState: { paddingVertical: 26, alignItems: 'center', justifyContent: 'center', gap: 10 },
  centerStateText: { fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryText: { fontWeight: '800' },

  grid: { paddingBottom: 24, gap: 16, paddingHorizontal: 2 },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 200, // Altura mínima para evitar recortes
  },
  cardImage: { width: '100%', height: 140 },
  cardImagePlaceholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  cardBody: { padding: 12, position: 'relative', minHeight: 60 }, // Altura mínima del body
  cardTitle: { fontWeight: '700', marginBottom: 4, fontSize: 14, lineHeight: 18 },
  cardSubtitle: { color: '#8a7c70', fontSize: 12, marginBottom: 4 },
  cardPrice: { marginTop: 4, fontWeight: '800', fontSize: 13 },
  bookmark: { position: 'absolute', right: 8, top: 8, padding: 6, borderRadius: 12, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },

  // Services list styles
  serviceCard: {
    flexDirection: 'row',
    gap: 12,
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
  serviceImagePlaceholder: {
    width: 120,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: { fontWeight: '800', marginBottom: 6, color: '#2d2420', fontSize: 14 },
  serviceDesc: { color: '#6f635b', fontSize: 12 },
  // chips removed
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fde68a', padding: 10, borderRadius: 12, marginBottom: 10 },
  infoBannerText: { color: '#92400e', fontWeight: '600' },
  // Bottom sheet modal styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  backdropClickable: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, gap: 12, maxHeight: '85%' },
  optionsContainer: { maxHeight: 350, minHeight: 220 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  optionLabel: { fontWeight: '600' },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  checkboxUnchecked: { borderColor: '#C7C7C7', backgroundColor: '#fff' },
  checkboxChecked: { borderColor: '#6b4028', backgroundColor: '#6b4028' },
  priceLabel: { fontWeight: '700' },
  priceInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  saveBtn: { marginTop: 12, alignSelf: 'center', width: '90%', backgroundColor: '#6b4028', borderRadius: 16, paddingVertical: 14, alignItems: 'center', minHeight: 50 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  centerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  warnCard: { borderRadius: 16, padding: 16, width: '90%' },
  warnBtn: { flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  warnBtnLight: { backgroundColor: '#e5e7eb' },
  warnBtnText: { color: '#fff', fontWeight: '700' },
  customProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginTop: 16,
    marginBottom: 8,
  },
  customProductIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customProductContent: { flex: 1 },
  customProductTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  customProductSubtitle: { fontSize: 14, lineHeight: 18 },
});


// Simple bottom sheet with overlay-first animation
function BottomSheet({
  visible,
  onClose,
  children,
  sheetStyle,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
}) {
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
      <Animated.View style={[styles.modalSheet, sheetStyle, { transform: [{ translateY }] }]}> 
        {children}
      </Animated.View>
    </View>
  );
}

