import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/theme';
import { responsiveFontSize, moderateScale, verticalScale } from '../../../theme/responsive';

const BROWN = '#6b4028';
const INPUT_BG = '#EEF0F5';
const LINK_BLUE = '#2563eb';
const SECONDARY_BG = '#F4EFFF';

export default function LoginScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const onLogin = () => {
    navigation.replace('Main');
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background, minHeight: Dimensions.get('window').height }]} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', marginTop: verticalScale(160), marginBottom: verticalScale(20) }}>
        <Text style={{ fontSize: responsiveFontSize(28), fontWeight: '800', color: theme.colors.text, textAlign: 'center' }}>Confort & Estilo</Text>
      </View>

      <View style={{ marginTop: 6 }}>
        <Text style={{ fontWeight: '700', color: theme.colors.text, marginBottom: 8, fontSize: responsiveFontSize(12) }}>Correo Electrónico</Text>
        <View style={[styles.inputPill, { backgroundColor: INPUT_BG }, errors.email && { borderColor: '#ef4444' }]}> 
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="correo@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.colors.muted}
            style={styles.inputFlat}
          />
        </View>
        {errors.email ? <Text style={{ color: '#ef4444', marginTop: 6 }}>{errors.email}</Text> : null}

        <Text style={{ fontWeight: '700', color: theme.colors.text, marginBottom: 8, marginTop: 18, fontSize: responsiveFontSize(12) }}>Ingresa tu contraseña</Text>
        <View style={[styles.inputPill, { backgroundColor: INPUT_BG }, errors.password && { borderColor: '#ef4444' }]}> 
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="ingresa tu contraseña"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            placeholderTextColor={theme.colors.muted}
            style={styles.inputFlat}
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.muted} />
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={{ color: '#ef4444', marginTop: 6 }}>{errors.password}</Text> : null}

        <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 6 }}>
          <Text style={{ color: LINK_BLUE, fontWeight: '600', fontSize: responsiveFontSize(11) }}>Olvidé mi contraseña</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 18, alignItems: 'center', gap: 12 }}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onLogin}>
            <Text style={styles.primaryText}>Iniciar sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.secondaryText}>Crear cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1, justifyContent: 'flex-start' },
  inputPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: '#E5E7EB' },
  inputFlat: { flex: 1, color: '#111827' },
  primaryBtn: { alignSelf: 'center', width: '86%', backgroundColor: BROWN, paddingVertical: moderateScale(12), borderRadius: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { alignSelf: 'center', width: '86%', paddingVertical: moderateScale(12), borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: BROWN, backgroundColor: SECONDARY_BG },
  secondaryText: { color: '#4B5563', fontWeight: '700' },
});



