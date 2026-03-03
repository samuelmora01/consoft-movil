import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';
import { useTheme } from '../../../theme/theme';
import { responsiveFontSize, moderateScale } from '../../../theme/responsive';
import { AuthApi } from '../../../api/client';
import { API } from '../../../config';
import { useToast } from '../../../ui/ToastProvider';
import { useUserStore } from '../../../store/userStore';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { show } = useToast();
  const setContact = useUserStore((s) => s.setContact);

  const onLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (!API) throw new Error('Configura la URL del backend (API) en app.json');
      await AuthApi(API).login(email, password);
      const me: any = await AuthApi(API).me();
      const u = (me?.user || me) as any;
      if (u?.email) {
        setContact({
          backupEmail: u.email,
          backupPhone: '',
          defaultAddress: u.address || '',
        });
      }
      navigation.replace('Main');
    } catch (e) {
      const msg = (e as Error)?.message || 'Error al iniciar sesión';
      show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Panel de Login Centrado */}
          <View style={styles.centerContainer}>
            {/* Título cerca del panel */}
            <View style={styles.titleNearPanel}>
              <Text style={styles.brandTitle}>Confort & Estilo</Text>
            </View>
            <View style={styles.loginPanel}>
              <View style={styles.loginContent}>
                <Text style={styles.loginTitle}>INICIA SESIÓN</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="demo@consoft.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CONTRASEÑA</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      style={[styles.input, { flex: 1 }]}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeIcon}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.continueBtn, loading && styles.continueBtnDisabled]} 
                  onPress={onLogin}
                  disabled={loading}
                >
                  <Text style={styles.continueText}>{loading ? 'Cargando...' : 'Continuar'}</Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>O ESCRÍBENOS</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.registerLink}>Regístrate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  titleNearPanel: {
    alignItems: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: responsiveFontSize(22),
    fontWeight: '700',
    color: '#d4a574',
    textAlign: 'center',
    letterSpacing: 1,
  },
  loginPanel: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 26, 26, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loginContent: {
    padding: 24,
  },
  loginTitle: {
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: responsiveFontSize(10),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    height: 44,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: responsiveFontSize(14),
  },
  eyeIcon: {
    padding: 4,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 6,
    marginBottom: 18,
  },
  forgotText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
  },
  continueBtn: {
    backgroundColor: '#d4a574',
    paddingVertical: moderateScale(14),
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 18,
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueText: {
    color: '#1a1a1a',
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: responsiveFontSize(10),
    fontWeight: '600',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: responsiveFontSize(13),
  },
  registerLink: {
    color: '#d4a574',
    fontSize: responsiveFontSize(13),
    fontWeight: '700',
  },
});



