import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useFavoritesStore } from '../store/favoritesStore';

export default function SavedScreen({ navigation }: any) {
  const items = useFavoritesStore((s) => s.items);
  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.empty}> 
          <Text style={{ color: '#6b7280' }}>No tienes productos guardados</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProductDetail', { item })}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.material}</Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#eee' },
  image: { width: 80, height: 80, borderRadius: 12 },
  title: { fontWeight: '800', marginBottom: 4, color: '#111827' },
  subtitle: { color: '#6b7280' },
});





