import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { OrdersApi, UsersApi } from '../../../api/client';
import { API } from '../../../config';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CustomerChatRoot() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!API) throw new Error('Configura API');
        setLoading(true);
        // Si nos pasan un id explícito, ir directo a la sala
        const forcedId = route.params?.id as string | undefined;
        if (forcedId) {
          navigation.replace('ChatRoom', { id: forcedId, title: 'Chat' });
          return;
        }
        // Preferir sala DM con el admin basada en el email del usuario
        try {
          const me = await UsersApi(API).me();
          const u: any = (me as any)?.user || me;
          if (u?.email) {
            navigation.replace('ChatRoom', { id: `dm:${u.email}`, title: 'Chat' });
            return;
          }
        } catch {}
        const res = await OrdersApi(API).mine();
        const list: any[] = (res as any).orders || [];
        // elegir el más reciente si hay varios
        const sorted = list.sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
        const first = sorted[0];
        if (first && (first._id || first.id)) {
          navigation.replace('ChatRoom', { id: first._id || first.id, title: first.code ? `Pedido #${first.code}` : 'Chat' });
          return;
        }
        setError('Aún no tienes pedidos. El chat se activará cuando tengas uno.');
      } catch (e) {
        setError((e as Error)?.message || 'No se pudo abrir el chat');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors?.background }}>
        <ActivityIndicator color={theme.colors?.primary} />
        <Text style={{ color: theme.colors?.muted, marginTop: 8 }}>Preparando tu chat…</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: theme.colors?.background }}>
      <Text style={{ color: theme.colors?.muted, textAlign: 'center' }}>{error}</Text>
    </View>
  );
}


