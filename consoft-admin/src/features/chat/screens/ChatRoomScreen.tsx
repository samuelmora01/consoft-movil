import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { RouteProp, useRoute, useFocusEffect } from '@react-navigation/native';
import { API } from '../../../config';
import { createSocket } from '../../../realtime/socket';
import { fetchConversationHistory, sendConversationMessage } from '../chatService';
import { useToast } from '../../../ui/ToastProvider';
import { useChatStore } from '../../../store/chatStore';
import { AuthApi } from '../../../api/client';

const EMPTY_MESSAGES: Message[] = [];

type Message = { _id: string; message: string; sentAt: string; mine?: boolean; sender?: any };

export default function ChatRoomScreen() {
  const { theme } = useTheme();
  const route = useRoute<any>();
  const convId = route.params?.id as string;
  const title = route.params?.title as string | undefined;
  const [input, setInput] = useState('');
  const messages = useChatStore((s) => s.roomIdToMessages[convId] ?? EMPTY_MESSAGES);
  const setRoomMessages = useChatStore((s) => s.setRoomMessages);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);
  const { show } = useToast();
  const [myEmail, setMyEmail] = useState<string | null>(null);
  const [dmUserId, setDmUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      // Si es DM por email, resolver userId primero
      if (convId?.startsWith('dm:') && !dmUserId) {
        const email = convId.slice(3);
        try {
          const res = await fetch(`${API}/api/users?search=${encodeURIComponent(email)}`, { credentials: 'include' as any } as RequestInit);
          if (res.ok) {
            const data: any = await res.json().catch(() => ({}));
            const list: any[] = data?.users || data || [];
            const found = list.find((u: any) => String(u.email).toLowerCase() === String(email).toLowerCase());
            if (found?._id || found?.id) setDmUserId(found._id || found.id);
          }
        } catch {}
      }
      if ((messages || []).length === 0) {
        // Cargar historial: DM nuevo endpoint si tenemos dmUserId
        if (convId?.startsWith('dm:') && dmUserId) {
          try {
            const r = await fetch(`${API}/api/chat/dm/${encodeURIComponent(dmUserId)}`, { credentials: 'include' as any } as RequestInit);
            if (r.ok) {
              const data = await r.json().catch(() => ([]));
              const arr: any[] = data?.messages || data || [];
              const mapped = arr.map((m: any) => ({ _id: m._id || m.id, message: m.message || m.text, sentAt: m.sentAt || m.createdAt, sender: m.sender }));
              setRoomMessages(convId, mapped);
            }
          } catch {}
        } else {
          const history = await fetchConversationHistory(convId);
          setRoomMessages(convId, history.map((h) => ({ _id: h._id, message: h.message, sentAt: h.sentAt, sender: h.sender })));
        }
      }
    })();
  }, [convId, dmUserId]);
  useEffect(() => {
    (async () => {
      try {
        if (!API) return;
        const me: any = await AuthApi(API).me();
        const u = me?.user || me;
        if (u?.email) setMyEmail(u.email.toLowerCase());
      } catch {}
    })();
  }, []);
  // Evita recarga innecesaria; sólo si no hay mensajes cargados
  // No recargar en cada foco; si ya hay mensajes en store, no hacemos nada
  useFocusEffect(React.useCallback(() => { return () => {}; }, []));

  useEffect(() => {
    if (!API) return;
    const s = createSocket(API);
    socketRef.current = s;
    if (convId?.startsWith('dm:') && dmUserId) {
      // admin escucha DM usando userId del cliente
      s.emit('dm:join', { userId: dmUserId });
    } else {
      // Join room using both orders and quotations namespaces to be robust
      s.emit('order:join', { orderId: convId });
      s.emit('quotation:join', { quotationId: convId });
    }
    const onDm = (m: any) => {
      if (!(convId?.startsWith('dm:') && dmUserId)) return;
      if (m?.fromUserId === dmUserId || m?.toUserId === dmUserId) {
        appendMessage(convId, {
          _id: m._id || String(Date.now()),
          message: m.message,
          sentAt: m.sentAt || new Date().toISOString(),
          sender: m.sender,
          mine: false,
        });
      }
    };
    const onLegacy = (m: any) => {
      const matchDm = convId?.startsWith('dm:') && (m?.roomId === convId);
      const matchLegacy = m?.quotation === convId || m?.order === convId || m?.quotationId === convId || m?.orderId === convId;
      if (matchDm || matchLegacy) {
        const senderEmail = (m?.sender?.email || '').toLowerCase();
        appendMessage(convId, {
          _id: m._id || String(Date.now()),
          message: m.message,
          sentAt: m.sentAt || new Date().toISOString(),
          sender: m.sender,
          mine: myEmail ? senderEmail === myEmail : undefined,
        });
      }
    };
    s.on('dm:message', onDm);
    s.on('chat:message', onLegacy);
    return () => {
      s.off('dm:message', onDm);
      s.off('chat:message', onLegacy);
      s.disconnect();
    };
  }, [convId, dmUserId]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    // Persist via REST; si falla, avisa y no agrega el mensaje local
    try {
      if (convId?.startsWith('dm:') && dmUserId) {
        // Para DMs, confiamos en socket + backend para persistir
      } else {
        await sendConversationMessage(convId, text);
      }
    } catch (e) {
      show((e as Error)?.message || 'No se pudo enviar el mensaje', 'error');
      return;
    }
    // Emitir en tiempo real si hay socket
    if (socketRef.current) {
      if (convId?.startsWith('dm:') && dmUserId) {
        socketRef.current.emit('dm:message', { toUserId: dmUserId, message: text });
      } else {
        socketRef.current.emit('chat:message', { orderId: convId, quotationId: convId, message: text });
      }
    }
    // No agregamos local; esperamos el eco del servidor para evitar duplicados
    setInput('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={messages}
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


