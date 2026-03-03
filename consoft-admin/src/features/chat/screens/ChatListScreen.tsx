import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { listAdminConversations, listDmConversations, Conversation } from '../chatService';
import { useAppStore } from '../../../store/appStore';

export default function ChatListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const clearUnread = useAppStore((s) => s.clearChatUnread);
  async function loadChats() {
    try {
      setLoading(true);
      // Un solo chat por usuario: listAdminConversations ya devuelve rooms dm:<email>
      const onePerUser = await listAdminConversations();
      setItems(onePerUser);
      setError(null);
    } catch (e) {
      setError((e as Error)?.message || 'No se pudo cargar los chats');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadChats(); }, []);
  useFocusEffect(
    React.useCallback(() => {
      loadChats();
      clearUnread();
      return () => {};
    }, [clearUnread])
  );
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
            style={[styles.item, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate('ChatRoom', { id: item.id, title: item.title })}
          >
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>{item.title}</Text>
            {item.lastMessage ? <Text style={{ color: theme.colors.muted }} numberOfLines={1}>{item.lastMessage}</Text> : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={{ alignItems: 'center', padding: 24 }}><Text style={{ color: theme.colors.muted }}>No hay chats</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  item: { padding: 14, borderRadius: 12, borderWidth: 1 },
  title: { fontWeight: '700', marginBottom: 4 },
});


