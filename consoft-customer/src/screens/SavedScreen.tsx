import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavoritesStore } from '../store/favoritesStore';

export default function SavedScreen({ navigation }: any) {
  const items = useFavoritesStore((s) => s.items);
  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.empty}> 
          <Ionicons name="bed-outline" size={112} color="#6b7280" />
          <Text style={styles.emptyTitle}>¡Uups!</Text>
          <Text style={styles.emptySubtitle}>Aún no tienes guardados</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Buscar')}> 
            <Text style={styles.ctaText}>Buscar inmuebles</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gridCard} activeOpacity={0.9} onPress={() => navigation.navigate('ProductDetail', { item })}>
              <Image source={{ uri: item.image }} style={styles.gridImage} resizeMode="cover" />
              <View style={styles.bookmark}><Ionicons name="bookmark" size={18} color="#F6C453" /></View>
              <View style={styles.gridBody}>
                <Text style={styles.gridTitle}>{item.title}</Text>
                <Text style={styles.gridSubtitle}>{item.material}</Text>
              </View>
            </TouchableOpacity>
          )}
          numColumns={2}
          columnWrapperStyle={{ gap: 16 }}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 12 },
  emptySubtitle: { color: '#6b7280', marginTop: 8, marginBottom: 16 },
  ctaBtn: { backgroundColor: '#6b4028', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999, marginTop: 6 },
  ctaText: { color: '#fff', fontWeight: '700' },
  // Grid cards similar to SearchScreen
  grid: { paddingHorizontal: 20, paddingTop: 100, paddingBottom: 32, gap: 16 },
  gridCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  gridImage: { width: '100%', height: 124 },
  gridBody: { padding: 12, position: 'relative', borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  gridTitle: { fontWeight: '700', marginBottom: 6, color: '#111827' },
  gridSubtitle: { color: '#8a7c70', fontSize: 12 },
  bookmark: { position: 'absolute', right: 10, top: 8, backgroundColor: '#fff', padding: 6, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
});





