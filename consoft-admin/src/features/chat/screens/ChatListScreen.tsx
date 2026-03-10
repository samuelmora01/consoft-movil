import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { listAdminConversations, listDmConversations, Conversation } from '../chatService';
import { useAppStore } from '../../../store/appStore';
import { Ionicons } from '@expo/vector-icons';

export default function ChatListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Conversation[]>([]);
  const [filteredItems, setFilteredItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const clearUnread = useAppStore((s) => s.clearChatUnread);

  async function loadChats() {
    try {
      setLoading(true);
      const onePerUser = await listAdminConversations();
      setItems(onePerUser);
      setFilteredItems(onePerUser);
      setError(null);
    } catch (e) {
      setError((e as Error)?.message || 'No se pudo cargar los chats');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChats();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadChats();
      clearUnread();
      return () => {};
    }, [clearUnread])
  );

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter(item => 
      item.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchText, items]);

  const handleDeleteChat = (chatId: string, chatTitle: string) => {
    Alert.alert(
      'Eliminar chat',
      `¿Estás seguro que quieres eliminar el chat con ${chatTitle}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // Aquí iría la lógica para eliminar el chat
            // Por ahora solo lo removemos de la lista local
            setItems(prev => prev.filter(item => item.id !== chatId));
            setFilteredItems(prev => prev.filter(item => item.id !== chatId));
          }
        }
      ]
    );
  };
  if (loading) {
    return <View style={[styles.container, { backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: theme.colors.muted }}>Cargando…</Text></View>;
  }
  if (error) {
    return <View style={[styles.container, { backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: theme.colors.danger }}>{error}</Text></View>;
  }
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Barra de búsqueda */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Ionicons name="search" size={20} color={theme.colors.muted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Buscar por nombre o correo..."
          placeholderTextColor={theme.colors.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate('ChatRoom', { id: item.id, title: item.title })}
          >
            <View style={styles.row}>
              {/* Avatar grande */}
              <View style={[styles.avatar, { backgroundColor: item.avatarColor || '#D9D9D9' }]}>
                <Text style={[styles.avatarText, { color: '#fff' }]}>
                  {item.avatarInitials || item.title?.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              
              {/* Información del usuario */}
              <View style={styles.userInfo}>
                <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.email && (
                  <Text style={[styles.email, { color: theme.colors.muted }]} numberOfLines={1}>
                    {item.email}
                  </Text>
                )}
                {item.lastMessage ? (
                  <Text style={[styles.message, { color: theme.colors.muted }]} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                ) : null}
              </View>

              {/* Botón de eliminar */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteChat(item.id, item.title)}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          searchText ? (
            <View style={{ alignItems: 'center', padding: 24 }}>
              <Text style={{ color: theme.colors.muted }}>No se encontraron chats</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', padding: 24 }}>
              <Text style={{ color: theme.colors.muted }}>No hay chats</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8
  },
  searchIcon: {
    marginRight: 4
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4
  },
  item: { 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  avatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  avatarText: { 
    fontSize: 20, 
    fontWeight: '700' 
  },
  userInfo: { 
    flex: 1 
  },
  title: { 
    fontWeight: '700', 
    marginBottom: 4,
    fontSize: 18 
  },
  email: { 
    fontSize: 14, 
    marginBottom: 4,
    fontWeight: '500'
  },
  message: { 
    fontSize: 14 
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  }
});


