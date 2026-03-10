import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavoritesStore } from '../store/favoritesStore';
import { useTheme } from '../theme/theme';

export default function SavedScreen({ navigation }: any) {
  const { theme } = useTheme();
  const items = useFavoritesStore((s) => s.items);
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {items.length === 0 ? (
        <View style={styles.empty}> 
          <Ionicons name="bed-outline" size={112} color={theme.colors.muted} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>¡Uups!</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>Aún no tienes guardados</Text>
          <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate('Buscar')}> 
            <Text style={[styles.ctaText, { color: '#fff' }]}>Buscar inmuebles</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.gridCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} activeOpacity={0.9} onPress={() => navigation.navigate('ProductDetail', { item })}>
              <Image source={{ uri: item.image }} style={styles.gridImage} resizeMode="cover" />
              <View style={[styles.bookmark, { backgroundColor: 'rgba(255,255,255,0.9)' }]}><Ionicons name="bookmark" size={18} color="#F6C453" /></View>
              <View style={styles.gridBody}>
                <Text style={[styles.gridTitle, { color: theme.colors.text }]}>{item.title}</Text>
                <Text style={[styles.gridSubtitle, { color: theme.colors.muted }]}>{item.material}</Text>
              </View>
            </TouchableOpacity>
          )}
          numColumns={2}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, paddingHorizontal: 2 }}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 8 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  emptySubtitle: { marginTop: 8, marginBottom: 16 },
  ctaBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, marginTop: 6 },
  ctaText: { fontWeight: '700' },
  gridCard: { 
    borderRadius: 16, 
    overflow: 'hidden', 
    borderWidth: 1, 
    flex: 1, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 6, 
    shadowOffset: { width: 0, height: 2 }, 
    elevation: 2,
    minHeight: 200, // Altura mínima consistente con SearchScreen
  },
  gridImage: { width: '100%', height: 140 },
  bookmark: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    borderRadius: 12, 
    padding: 6,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: 'rgba(255,255,255,0.9)' 
  },
  gridBody: { padding: 12, minHeight: 60 }, // Altura mínima del body
  gridTitle: { fontWeight: '700', fontSize: 14, lineHeight: 18, marginBottom: 4 },
  gridSubtitle: { fontSize: 12, marginTop: 4, color: '#8a7c70' },
});
