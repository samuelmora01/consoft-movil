import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { RouteProp, useRoute } from '@react-navigation/native';
import { API } from '../../../config';
import { createSocket } from '../../../realtime/socket';
import { fetchConversationHistory } from '../chatService';

type Message = { _id: string; message: string; sentAt: string; mine?: boolean; sender?: any };

export default function ChatRoomScreen() {
  const { theme } = useTheme();
  const route = useRoute<any>();
  const convId = route.params?.id as string;
  const title = route.params?.title as string | undefined;
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Message[]>([]);
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);

  useEffect(() => {
    (async () => {
      if (convId?.startsWith('dm:')) {
        setMsgs([]); // historial DM opcional; depende del backend
      } else {
        const history = await fetchConversationHistory(convId);
        setMsgs(history.map((h) => ({ _id: h._id, message: (h as any).message || (h as any).text, sentAt: (h as any).sentAt || (h as any).createdAt, sender: h.sender })));
      }
    })();
  }, [convId]);

  useEffect(() => {
    if (!API) return;
    const s = createSocket(API);
    socketRef.current = s;
    if (convId?.startsWith('dm:')) {
      // admin escucha DM para este usuario (convId = dm:<userEmail>)
      s.emit('chat:join', { roomId: convId, peer: 'admin@admin.com' });
    } else {
      // Join room using both orders and quotations namespaces to be robust
      s.emit('order:join', { orderId: convId });
      s.emit('quotation:join', { quotationId: convId });
    }
    s.on('chat:message', (m: any) => {
      const matchDm = convId?.startsWith('dm:') && (m?.roomId === convId);
      const matchLegacy = m?.quotation === convId || m?.order === convId || m?.quotationId === convId || m?.orderId === convId;
      if (matchDm || matchLegacy) {
        setMsgs((prev) => [...prev, { _id: m._id || String(Date.now()), message: m.message, sentAt: m.sentAt || new Date().toISOString(), sender: m.sender }]);
      }
    });
    return () => {
      s.off('chat:message');
      s.disconnect();
    };
  }, [convId]);

  const send = () => {
    const text = input.trim();
    if (!text || !socketRef.current) return;
    if (convId?.startsWith('dm:')) {
      socketRef.current.emit('chat:message', { roomId: convId, to: 'admin@admin.com', message: text });
    } else {
      socketRef.current.emit('chat:message', { orderId: convId, quotationId: convId, message: text });
    }
    setMsgs((prev) => [...prev, { _id: `local-${Date.now()}`, message: text, sentAt: new Date().toISOString(), mine: true }]);
    setInput('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={msgs}
          keyExtractor={(m) => m._id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={{ alignItems: item.mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <View style={{ maxWidth: '80%', backgroundColor: item.mine ? theme.colors.primary : theme.colors.card, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 }}>
                <Text style={{ color: item.mine ? '#fff' : theme.colors.text }}>{item.message}</Text>
              </View>
            </View>
          )}
        />
        <View style={{ flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
          <TextInput value={input} onChangeText={setInput} placeholder="Escribe un mensaje..." placeholderTextColor={theme.colors.muted} style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]} />
          <TouchableOpacity onPress={send} style={[styles.sendBtn, { backgroundColor: theme.colors.primary }]}><Text style={{ color: '#fff', fontWeight: '700' }}>Enviar</Text></TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  sendBtn: { paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});


