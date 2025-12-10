import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { API } from '../config';
import { QuotationsApi } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FloatingCartButton({ top = 72, left = 14 }: { top?: number; left?: number }) {
  const navigation = useNavigation<any>();
  const [count, setCount] = useState<number>(0);
  const window = Dimensions.get('window');
  const pos = useRef(new Animated.ValueXY({ x: left, y: top })).current;
  const STORAGE_KEY = '@cart_fab_pos';

  async function refreshCount() {
    try {
      if (!API) return;
      const res = await QuotationsApi(API).getCart();
      const items: any[] = ((res as any)?.cart?.items) || (res as any)?.items || [];
      setCount(Array.isArray(items) ? items.length : 0);
    } catch {
      // ignore
    }
  }
  useEffect(() => {
    refreshCount();
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const { x, y } = JSON.parse(raw);
          pos.setValue({ x, y });
        }
      } catch {}
    })();
  }, []);
  useFocusEffect(React.useCallback(() => { refreshCount(); return () => {}; }, []));

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pos.setOffset({ x: (pos as any).__getValue().x, y: (pos as any).__getValue().y });
          pos.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
        onPanResponderRelease: async (_, gesture) => {
          pos.flattenOffset();
          // clamp within screen
          const padding = 8;
          const size = 44; // approximate touch size of fab
          let x = (pos as any).__getValue().x;
          let y = (pos as any).__getValue().y;
          x = Math.max(padding, Math.min(x, window.width - size - padding));
          y = Math.max(padding, Math.min(y, window.height - size - padding));
          pos.setValue({ x, y });
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
          } catch {}
        },
      }),
    [pos, window.height, window.width]
  );

  return (
    <Animated.View style={[styles.fab, { transform: [{ translateX: pos.x }, { translateY: pos.y }] }]} {...panResponder.panHandlers}>
      <TouchableOpacity onPress={() => navigation.navigate('Mis pedidos' as never, { screen: 'CartHome' } as never)} accessibilityLabel="Abrir carrito" accessibilityRole="button">
        <Ionicons name="cart-outline" size={22} color="#6b4028" />
        {count > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    zIndex: 50,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});


