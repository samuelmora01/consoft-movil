import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useAppStore } from '../../../store/appStore';
import { SalesDocument, OrderState } from '../../../domain/types';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale, responsiveFontSize } from '../../../theme/responsive';

export default function OrdersListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const documents = useAppStore((s) => s.documents);
  const [q, setQ] = useState('');
  

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return documents;
    return documents.filter((d) => `${d.id}`.toLowerCase().includes(query));
  }, [q, documents]);

  const empty = !documents.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, padding: theme.spacing(2) }]}> 
      {empty ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing(3) }}>
          <Text style={{ fontSize: responsiveFontSize(22), fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing(2) }}>Pedidos</Text>
          <MaterialCommunityIcons name="sofa-outline" size={moderateScale(120)} color={theme.colors.text} />
          <Text style={{ color: theme.colors.muted, marginTop: theme.spacing(2), fontSize: responsiveFontSize(12), textAlign: 'center' }}>Aún no tienes Pedidos asignados</Text>
        </View>
      ) : (
        <>
          <TextInput
            placeholder="Buscar pedidos"
            placeholderTextColor={theme.colors.muted}
            value={q}
            onChangeText={setQ}
            style={[
              styles.search,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
                borderRadius: theme.radius,
                paddingHorizontal: theme.spacing(1.5),
                paddingVertical: theme.spacing(1.25),
                marginBottom: theme.spacing(1.5),
              },
            ]}
          />
          
          <FlatList
            data={filtered}
            keyExtractor={(d: SalesDocument) => d.id}
            contentContainerStyle={{ paddingBottom: theme.spacing(3) }}
            renderItem={({ item: d }) => (
              <TouchableOpacity
                onPress={() => navigation.navigate('OrderDetail', { documentId: d.id })}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius,
                    marginBottom: theme.spacing(2),
                    overflow: 'hidden',
                  },
                ]}
                activeOpacity={0.9}
              >
                <View style={{ position: 'relative', padding: theme.spacing(1.75) }}>
                  <MaterialCommunityIcons name="truck-delivery-outline" size={moderateScale(20)} color={theme.colors.primary} style={{ position: 'absolute', right: theme.spacing(0.5), top: theme.spacing(0.5) }} />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {d.featuredImage ? (
                      <Image source={{ uri: d.featuredImage }} style={[styles.thumb, { borderRadius: theme.radius, width: scale(64), height: scale(64) }]} contentFit="cover" />
                    ) : (
                      <View style={[styles.thumb, { borderRadius: theme.radius, width: scale(64), height: scale(64) }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(14), textDecorationLine: 'underline' }}>
                        Pedido #{d.id.slice(0, 6).toUpperCase()}
                      </Text>
                      <Text style={{ color: theme.colors.muted, marginTop: 2 }}>Tapicería... →</Text>
                      <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: responsiveFontSize(26), marginTop: 6 }}>
                        ${d.items.reduce((s, i) => s + i.price, 0).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
                {(() => {
                  const base = new Date(d.createdAt ?? new Date().toISOString());
                  base.setDate(base.getDate() + 7);
                  const fechaEntrega = base.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
                  return (
                    <View style={{ backgroundColor: theme.colors.border, paddingVertical: theme.spacing(1.25), paddingHorizontal: theme.spacing(2), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border }}>
                      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(14) }}>
                        Fecha de entrega : {fechaEntrega}
                      </Text>
                    </View>
                  );
                })()}
              </TouchableOpacity>
            )}
          />
        </>
      )}
      {empty ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('OrderEdit', {})}
          style={[
            styles.emptyCta,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              paddingVertical: theme.spacing(1.75),
              paddingHorizontal: theme.spacing(2.25),
              borderRadius: 999,
              bottom: theme.spacing(6),
            },
          ]}
        > 
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Agregar Pedido</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => navigation.navigate('OrderEdit', {})} style={[styles.fab, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, right: theme.spacing(2), bottom: theme.spacing(2), paddingVertical: theme.spacing(1.5), paddingHorizontal: theme.spacing(2), borderRadius: theme.radius }]}> 
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Agregar Pedido</Text>
        </TouchableOpacity>
      )}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { borderWidth: 1 },
  card: { borderWidth: 1 },
  thumb: { width: 64, height: 64, backgroundColor: '#D9D9D9' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  fab: { position: 'absolute', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  emptyCta: { position: 'absolute', alignSelf: 'center', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  
});



