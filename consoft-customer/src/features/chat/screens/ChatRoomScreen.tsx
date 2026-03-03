import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { API } from '../../../config';
import { io, Socket } from 'socket.io-client';
import { AuthApi } from '../../../api/client';
import { useChatStore } from '../chatStore';

const EMPTY_MESSAGES: Message[] = [];
async function sendMessage(API: string, id: string, message: string) {
  if (!API || !message) return;
  const isDm = id?.startsWith('dm:');
  const body = isDm ? { roomId: id, to: 'admin@admin.com', message } : { message };
  const candidates = isDm
    ? [
        { path: '/api/chat/messages', method: 'POST' as const, body },
        { path: `/api/chat/rooms/${encodeURIComponent(id)}/messages`, method: 'POST' as const, body: { message } },
      ]
    : [
        { path: `/api/orders/${id}/messages`, method: 'POST' as const, body },
        { path: `/api/quotations/${id}/messages`, method: 'POST' as const, body },
      ];
  for (const c of candidates) {
    try {
      const res = await fetch(`${API}${c.path}`, {
        method: c.method,
        credentials: 'include' as any,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c.body),
      } as RequestInit);
      if (res.ok) return;
    } catch {}
  }
}
async function fetchHistory(API: string, id: string, dmUserId?: string) {
  if (!API) return [];
  const isDm = !!dmUserId || id?.startsWith('dm:');
  const base = isDm
    ? (dmUserId ? [`/api/chat/dm/${encodeURIComponent(dmUserId)}`] : [
        `/api/chat/messages?roomId=${encodeURIComponent(id)}`,
        `/api/messages?roomId=${encodeURIComponent(id)}`,
        `/api/chat/rooms/${encodeURIComponent(id)}/messages`,
        `/api/chat/${encodeURIComponent(id)}/messages`,
      ])
    : [`/api/orders/${id}/messages`, `/api/quotations/${id}/messages`, `/api/chat/messages?roomId=${encodeURIComponent(id)}`];
  for (const p of base) {
    try {
      const res = await fetch(`${API}${p}`, { credentials: 'include' as any } as RequestInit);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const arr: any[] = (data && (data.messages || data)) || [];
        return arr.map((m: any) => ({
          _id: m._id || m.id || String(Math.random()),
          message: m.message || m.text,
          sentAt: m.sentAt || m.createdAt || new Date().toISOString(),
        }));
      }
    } catch {}
  }
  return [];
}

type Message = { _id: string; message: string; sentAt: string; mine?: boolean };

export default function ChatRoomScreen() {
  const { theme } = useTheme();
  const route = useRoute<any>();
  const convId = route.params?.id as string;
  const dmUserId = route.params?.dmUserId as string | undefined;
  const [input, setInput] = useState('');
  const messages = useChatStore((s) => s.roomIdToMessages[convId] ?? EMPTY_MESSAGES);
  const setRoomMessages = useChatStore((s) => s.setRoomMessages);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const socketRef = useRef<Socket | null>(null);
  const [myEmail, setMyEmail] = useState<string | null>(null);
  // Track recently sent messages to evitar duplicados cuando llega el eco del servidor
  const recentlySentRef = React.useRef<Record<string, number>>({});
  useEffect(() => {
    (async () => {
      if ((messages || []).length === 0) {
        const history = await fetchHistory(API as string, convId, dmUserId);
        setRoomMessages(convId, history);
      }
    })();
  }, [convId, dmUserId]);
  useEffect(() => {
    (async () => {
      try {
        if (!API) return;
        const me: any = await AuthApi(API as string).me();
        const u = me?.user || me;
        if (u?.email) setMyEmail((u.email as string).toLowerCase());
      } catch {}
    })();
  }, []);
  // Evita recarga constante; sólo cuando no hay mensajes en memoria
  useFocusEffect(
    React.useCallback(() => {
      if (messages.length === 0) {
        (async () => {
          const h = await fetchHistory(API as string, convId);
          setRoomMessages(convId, h);
        })();
      }
      return () => {};
    }, [convId, messages.length])
  );
  useEffect(() => {
    if (!API) return;
    const s = io(API, { withCredentials: true, transports: ['websocket'] });
    socketRef.current = s;
    s.on('connect', () => console.log('[socket] connected'));
    s.on('connect_error', (e) => console.log('[socket] connect_error', e?.message));
    s.on('error', (e: any) => console.log('[socket] error', e));
    if (dmUserId) {
      s.emit('dm:join', { userId: dmUserId });
    } else if (convId?.startsWith('dm:')) {
      s.emit('chat:join', { roomId: convId, peer: 'admin@admin.com' });
    } else {
      s.emit('order:join', { orderId: convId });
      s.emit('quotation:join', { quotationId: convId });
    }
    const onDm = (m: any) => {
      if (!dmUserId) return;
      if (m?.fromUserId === dmUserId || m?.toUserId === dmUserId) {
        const senderEmail = (m?.sender?.email || '').toLowerCase();
        const mine = myEmail ? senderEmail === myEmail : undefined;
        const key = String(m?.message || '');
        const last = recentlySentRef.current[key];
        const now = Date.now();
        if (mine && last && now - last < 5000) {
          delete recentlySentRef.current[key];
          return;
        }
        appendMessage(convId, { _id: m._id || String(Date.now()), message: m.message, sentAt: m.sentAt || new Date().toISOString(), mine });
      }
    };
    const onLegacy = (m: any) => {
      const matchDm = convId?.startsWith('dm:') && (m?.roomId === convId);
      const matchLegacy = m?.quotation === convId || m?.order === convId || m?.quotationId === convId || m?.orderId === convId;
      if (matchDm || matchLegacy) {
        const senderEmail = (m?.sender?.email || '').toLowerCase();
        const mine = myEmail ? senderEmail === myEmail : undefined;
        // Si es eco propio y se envió el mismo texto hace < 5s, no duplicar
        const key = String(m?.message || '');
        const last = recentlySentRef.current[key];
        const now = Date.now();
        if (mine && last && now - last < 5000) {
          delete recentlySentRef.current[key];
          return;
        }
        appendMessage(convId, { _id: m._id || String(Date.now()), message: m.message, sentAt: m.sentAt || new Date().toISOString(), mine });
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
  const send = () => {
    const text = input.trim();
    if (!text) return;
    // Persist via REST (dispara email si admin offline según backend)
    sendMessage(API as string, convId, text).catch(() => {});
    if (socketRef.current) {
      if (dmUserId) {
        socketRef.current.emit('dm:message', { toUserId: dmUserId, message: text }, (ack?: { ok?: boolean; error?: string }) => {
          if (ack && ack.ok === false) {
            console.log('[socket] dm:message ack error', ack.error);
          } else {
            console.log('[socket] dm:message ack ok');
          }
        });
      } else if (convId?.startsWith('dm:')) {
        socketRef.current.emit('chat:message', { roomId: convId, to: 'admin@admin.com', message: text }, (ack?: { ok?: boolean; error?: string }) => {
          if (ack && ack.ok === false) console.log('[socket] chat:message ack error', ack.error);
        });
      } else {
        socketRef.current.emit('chat:message', { orderId: convId, quotationId: convId, message: text }, (ack?: { ok?: boolean; error?: string }) => {
          if (ack && ack.ok === false) console.log('[socket] chat:message ack error', ack.error);
        });
      }
    }
    // Optimista: añade el mensaje localmente para feedback inmediato
    recentlySentRef.current[text] = Date.now();
    appendMessage(convId, { _id: `local-${Date.now()}`, message: text, sentAt: new Date().toISOString(), mine: true });
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
              <View
                style={{
                  maxWidth: '80%',
                  backgroundColor: item.mine ? theme.colors.primary : theme.colors.card,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  borderWidth: item.mine ? 0 : 1,
                  borderColor: item.mine ? 'transparent' : theme.colors.border,
                }}
              >
                <Text style={{ color: item.mine ? '#fff' : theme.colors.text }}>{item.message}</Text>
              </View>
            </View>
          )}
        />
        <View style={{ flexDirection: 'row', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, color: theme.colors.text }]}
          />
          <TouchableOpacity onPress={send} style={[styles.sendBtn, { backgroundColor: theme.colors.primary }]}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  sendBtn: { paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});


