import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { OrdersApi } from '../../../api/client';
import { API } from '../../../config';

export default function ChatListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        if (!API) throw new Error('Configura API');
        const res = await OrdersApi(API).mine();
        const list: any[] = (res as any).orders || [];
        setItems(list.map((o: any, idx: number) => ({ id: o._id || String(idx), title: o.code ? `Pedido #${o.code}` : 'Pedido' })));
        setError(null);
      } catch (e) {
        setError((e as Error)?.message || 'No se pudo cargar');
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  if (loading) {
    return <View style={[styles.container, { backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: theme.colors.muted }}>Cargando…</Text></View>;
  }
  if (error) {
    return <View style={[styles.container, { backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: theme.colors.danger }}>{error}</Text></View>;
  }
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate('ChatRoom', { id: item.id, title: item.title })}
          >
            <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  item: { padding: 14, borderRadius: 12, borderWidth: 1 },
  title: { fontWeight: '700' },
});


