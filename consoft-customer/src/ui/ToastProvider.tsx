import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

type ToastContextValue = {
  show: (message: string, type?: ToastType, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  const show = useCallback((msg: string, t: ToastType = 'info', durationMs = 1800) => {
    setMessage(msg);
    setType(t);
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
    ]).start();
    hideTimeout.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 180, useNativeDriver: true }),
      ]).start();
    }, durationMs);
  }, [opacity, translateY]);

  const background = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#374151';

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}> 
          <View style={[styles.bubble, { backgroundColor: background }]}> 
            <Text style={styles.text}>{message}</Text>
          </View>
        </Animated.View>
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', left: 0, right: 0, bottom: 32, alignItems: 'center' },
  bubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  text: { color: '#fff', fontWeight: '700' },
});





