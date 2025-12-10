import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useRoute } from '@react-navigation/native';
import { API } from '../../../config';
import { io, Socket } from 'socket.io-client';

type Message = { _id: string; message: string; sentAt: string; mine?: boolean };

export default function ChatRoomScreen() {
  const { theme } = useTheme();
  const route = useRoute<any>();
  const convId = route.params?.id as string;
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Message[]>([]);
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    if (!API) return;
    const s = io(API, { withCredentials: true, transports: ['websocket'] });
    socketRef.current = s;
    if (convId?.startsWith('dm:')) {
      s.emit('chat:join', { roomId: convId, peer: 'admin@admin.com' });
    } else {
      s.emit('order:join', { orderId: convId });
      s.emit('quotation:join', { quotationId: convId });
    }
    s.on('chat:message', (m: any) => {
      const matchDm = convId?.startsWith('dm:') && (m?.roomId === convId);
      const matchLegacy = m?.quotation === convId || m?.order === convId || m?.quotationId === convId || m?.orderId === convId;
      if (matchDm || matchLegacy) {
        setMsgs((prev) => [...prev, { _id: m._id || String(Date.now()), message: m.message, sentAt: m.sentAt || new Date().toISOString() }]);
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
      <View style={[styles.container]}>
        <FlatList
          data={msgs}
          keyExtractor={(m) => m._id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={{ alignItems: item.mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <View style={{ maxWidth: '80%', backgroundColor: item.mine ? theme.colors.primary : '#fff', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 }}>
                <Text style={{ color: item.mine ? '#fff' : '#111827' }}>{item.message}</Text>
              </View>
            </View>
          )}
        />
        <View style={{ flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
          <TextInput value={input} onChangeText={setInput} placeholder="Escribe un mensaje..." style={[styles.input]} />
          <TouchableOpacity onPress={send} style={[styles.sendBtn]}><Text style={{ color: '#fff', fontWeight: '700' }}>Enviar</Text></TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12 },
  sendBtn: { paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6b4028' },
});


