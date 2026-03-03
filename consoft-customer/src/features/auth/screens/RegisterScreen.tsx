import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UsersApi, AuthApi } from '../../../api/client';
import { API } from '../../../config';
import { useToast } from '../../../ui/ToastProvider';
import { responsiveFontSize, moderateScale } from '../../../theme/responsive';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasUpper = /[A-ZÁÉÍÓÚÑ]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/.test(password);
  const hasMinLen = password.length >= 6;

  const valid = name && email && password.length >= 6 && password === confirm;
  const { show } = useToast();

  const onRegister = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (!API) throw new Error('Configura la URL del backend (API) en app.json');
      if (!valid) throw new Error('Completa los campos y valida la contraseña');
      await UsersApi(API).register(name, email, password);
      await AuthApi(API).login(email, password);
      await AuthApi(API).me();
      show('Registro exitoso', 'success');
      navigation.replace('Main');
    } catch (e) {
      const msg = (e as Error)?.message || 'Error al registrarte';
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
          {/* Panel de Registro Centrado */}
          <View style={styles.centerContainer}>
            {/* Título cerca del panel */}
            <View style={styles.titleNearPanel}>
              <Text style={styles.brandTitle}>Confort & Estilo</Text>
            </View>
            <View style={styles.registerPanel}>
              <View style={styles.registerContent}>
                <Text style={styles.registerTitle}>CREAR CUENTA</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>NOMBRE</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Tu nombre"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="correo@correo.com"
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
                      secureTextEntry={!showPwd}
                      autoCapitalize="none"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      style={[styles.input, { flex: 1 }]}
                    />
                    <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={styles.eyeIcon}>
                      <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.passwordRules}>
                    <View style={styles.passwordRuleRow}>
                      <Ionicons name={hasMinLen ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={hasMinLen ? '#22c55e' : 'rgba(255,255,255,0.45)'} />
                      <Text style={[styles.passwordRuleText, hasMinLen ? styles.passwordRuleTextOk : styles.passwordRuleTextPending]}>Mínimo 6 caracteres</Text>
                    </View>
                    <View style={styles.passwordRuleRow}>
                      <Ionicons name={hasUpper ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={hasUpper ? '#22c55e' : 'rgba(255,255,255,0.45)'} />
                      <Text style={[styles.passwordRuleText, hasUpper ? styles.passwordRuleTextOk : styles.passwordRuleTextPending]}>1 letra mayúscula</Text>
                    </View>
                    <View style={styles.passwordRuleRow}>
                      <Ionicons name={hasNumber ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={hasNumber ? '#22c55e' : 'rgba(255,255,255,0.45)'} />
                      <Text style={[styles.passwordRuleText, hasNumber ? styles.passwordRuleTextOk : styles.passwordRuleTextPending]}>1 número</Text>
                    </View>
                    <View style={styles.passwordRuleRow}>
                      <Ionicons name={hasSpecial ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={hasSpecial ? '#22c55e' : 'rgba(255,255,255,0.45)'} />
                      <Text style={[styles.passwordRuleText, hasSpecial ? styles.passwordRuleTextOk : styles.passwordRuleTextPending]}>1 caracter especial</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={confirm}
                      onChangeText={setConfirm}
                      placeholder="••••••••"
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      style={[styles.input, { flex: 1 }]}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeIcon}>
                      <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.registerBtn, !valid && styles.registerBtnDisabled]} 
                  onPress={onRegister}
                  disabled={!valid || loading}
                >
                  <Text style={styles.registerText}>{loading ? 'Cargando...' : 'Registrarme'}</Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>O INICIA SESIÓN</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.loginLink}>Inicia sesión</Text>
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
  registerPanel: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 26, 26, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  registerContent: {
    padding: 24,
  },
  registerTitle: {
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
  passwordRules: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  passwordRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordRuleText: {
    fontSize: responsiveFontSize(11),
    fontWeight: '600',
    flex: 1,
  },
  passwordRuleTextOk: {
    color: 'rgba(255,255,255,0.9)',
  },
  passwordRuleTextPending: {
    color: 'rgba(255,255,255,0.6)',
  },
  registerBtn: {
    backgroundColor: '#d4a574',
    paddingVertical: moderateScale(14),
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 18,
  },
  registerBtnDisabled: {
    opacity: 0.5,
  },
  registerText: {
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
  loginLink: {
    color: '#d4a574',
    fontSize: responsiveFontSize(13),
    fontWeight: '700',
  },
});





