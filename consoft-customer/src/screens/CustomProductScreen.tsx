import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/theme';
import { QuotationsApi } from '../api/client';
import { API } from '../config';

type Props = {
  navigation: any;
};

const WOOD_TYPES = ['Roble', 'Pino', 'Cedro', 'Nogal', 'Caoba', 'MDF', 'Aglomerado', 'Por definir'];
const COLORS = [
  { name: 'Natural', hex: '#D4A574' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Negro', hex: '#1A1A1A' },
  { name: 'Gris', hex: '#9CA3AF' },
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Verde', hex: '#10B981' },
  { name: 'Café', hex: '#92400E' },
];

export default function CustomProductScreen({ navigation }: Props) {
  const { theme } = useTheme();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [woodType, setWoodType] = useState('Por definir');
  const [quantity, setQuantity] = useState('1');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // UI state
  const [showWoodPicker, setShowWoodPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir una imagen de referencia');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!name.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa el nombre del mueble');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Campo requerido', 'Por favor describe el mueble que necesitas');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Cantidad inválida', 'La cantidad debe ser al menos 1');
      return;
    }

    try {
      setSubmitting(true);
      if (!API) throw new Error('Configura la URL del backend');

      await QuotationsApi(API).addCustomItem({
        name: name.trim(),
        description: description.trim(),
        woodType,
        quantity: qty,
        color: color || undefined,
        size: size || undefined,
        imageUri: imageUri || undefined,
      });

      Alert.alert(
        '¡Producto agregado!',
        'Tu mueble personalizado ha sido agregado al carrito',
        [
          {
            text: 'Ver carrito',
            onPress: () => navigation.navigate('Perfil', { screen: 'CartHome' }),
          },
          {
            text: 'Seguir buscando',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (e) {
      Alert.alert('Error', (e as Error)?.message || 'No se pudo agregar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Ionicons name="hammer" size={32} color={theme.colors.primary} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Diseño Personalizado</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.muted }]}>
          Completa los detalles y nos pondremos en contacto para cotizar tu mueble ideal
        </Text>
      </View>

      {/* Nombre del mueble */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Nombre del mueble *</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="cube-outline" size={18} color={theme.colors.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="Ej: Mesa de comedor moderna"
            placeholderTextColor={theme.colors.muted}
            value={name}
            onChangeText={setName}
          />
        </View>
      </View>

      {/* Descripción */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Descripción *</Text>
        <View style={[styles.textAreaContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} style={styles.textAreaIcon} />
          <TextInput
            style={[styles.textArea, { color: theme.colors.text }]}
            placeholder="Describe el mueble que necesitas: material, tela, estilo, etc..."
            placeholderTextColor={theme.colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Tipo de madera */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Tipo de madera</Text>
        <TouchableOpacity
          style={[styles.picker, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => setShowWoodPicker(!showWoodPicker)}
        >
          <Ionicons name="leaf-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.pickerText, { color: theme.colors.text }]}>{woodType}</Text>
          <Ionicons name={showWoodPicker ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.muted} />
        </TouchableOpacity>
        
        {showWoodPicker && (
          <View style={[styles.pickerOptions, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            {WOOD_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerOption, { borderBottomColor: theme.colors.border }]}
                onPress={() => {
                  setWoodType(type);
                  setShowWoodPicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, { color: woodType === type ? theme.colors.primary : theme.colors.text }]}>
                  {type}
                </Text>
                {woodType === type && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Cantidad y Dimensiones */}
      <View style={styles.row}>
        <View style={styles.halfSection}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Cantidad</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="layers-outline" size={18} color={theme.colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="1"
              placeholderTextColor={theme.colors.muted}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.halfSection}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Dimensiones</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="resize-outline" size={18} color={theme.colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Ej: 180 x 90 cm"
              placeholderTextColor={theme.colors.muted}
              value={size}
              onChangeText={setSize}
            />
          </View>
        </View>
      </View>

      {/* Color */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Color o acabado (opcional)</Text>
        <TouchableOpacity
          style={[styles.picker, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => setShowColorPicker(!showColorPicker)}
        >
          <Ionicons name="color-palette-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.pickerText, { color: color ? theme.colors.text : theme.colors.muted }]}>
            {color || 'Seleccionar color'}
          </Text>
          <Ionicons name={showColorPicker ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.muted} />
        </TouchableOpacity>

        {showColorPicker && (
          <View style={[styles.colorGrid, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c.name}
                style={[
                  styles.colorOption,
                  { borderColor: color === c.name ? theme.colors.primary : theme.colors.border },
                ]}
                onPress={() => {
                  setColor(c.name);
                  setShowColorPicker(false);
                }}
              >
                <View style={[styles.colorCircle, { backgroundColor: c.hex, borderColor: theme.colors.border }]} />
                <Text style={[styles.colorName, { color: theme.colors.text }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Imagen de referencia */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Imagen de referencia (opcional)</Text>
        <TouchableOpacity
          style={[styles.imageUpload, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={pickImage}
        >
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={[styles.removeImageBtn, { backgroundColor: theme.colors.background }]}
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="close-circle" size={24} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={48} color={theme.colors.muted} />
              <Text style={[styles.uploadText, { color: theme.colors.text }]}>Sube una imagen de referencia</Text>
              <Text style={[styles.uploadSubtext, { color: theme.colors.muted }]}>
                Ayúdanos a entender mejor tu idea
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Botón de enviar */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: theme.colors.primary, opacity: submitting ? 0.6 : 1 },
        ]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.submitText}>Agregar al carrito</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={[styles.footerNote, { color: theme.colors.muted }]}>
        * Campos requeridos. Nos pondremos en contacto contigo para confirmar detalles y enviarte una cotización.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', marginTop: 12 },
  headerSubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  section: { marginBottom: 20 },
  halfSection: { flex: 1 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15 },
  textAreaContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
  },
  textAreaIcon: { marginRight: 8, marginTop: 2 },
  textArea: { flex: 1, fontSize: 15, textAlignVertical: 'top' },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  pickerText: { flex: 1, fontSize: 15 },
  pickerOptions: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  pickerOptionText: { fontSize: 15, fontWeight: '600' },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
  },
  colorOption: {
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    width: '30%',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
  },
  colorName: { fontSize: 12, fontWeight: '600' },
  imageUpload: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  imagePreviewContainer: { width: '100%', position: 'relative' },
  imagePreview: { width: '100%', height: 200, borderRadius: 8 },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
  },
  uploadText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  uploadSubtext: { fontSize: 14, marginTop: 4 },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
