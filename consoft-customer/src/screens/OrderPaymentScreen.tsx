import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '../ui/ToastProvider';
import { OrdersApi } from '../api/client';
import { API } from '../config';
import { useTheme } from '../theme/theme';

export default function OrderPaymentScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const order = route?.params?.order;
  const toast = useToast();
  const qrs = useMemo(
    () => [
      'https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=consoft-payment-1',
      'https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=consoft-payment-2',
      'https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=consoft-payment-3',
    ],
    [],
  );
  const [qrIndex, setQrIndex] = useState(0);
  const [voucherUri, setVoucherUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<any>(null);

  const onPrev = () => setQrIndex((i) => (i - 1 + qrs.length) % qrs.length);
  const onNext = () => setQrIndex((i) => (i + 1) % qrs.length);

  async function pickVoucher() {
    try {
      const mediaType: any =
        (ImagePicker as any).MediaType?.Images ??
        (ImagePicker as any).MediaTypeOptions?.Images;
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: mediaType, quality: 0.8 });
      if (!res.canceled && res.assets?.length) {
        const uri = res.assets[0].uri;
        setVoucherUri(uri);
        // Preview OCR automático
        if (order?._id || order?.id) {
          setLoading(true);
          try {
            const preview = await OrdersApi(API).previewPaymentOCR(order._id || order.id, uri);
            setOcrPreview(preview);
            toast.show(`Monto detectado: $${(preview as any).detectedAmount || 0}`, 'success');
          } catch (e: any) {
            toast.show(e.message || 'Error al procesar OCR', 'error');
          } finally {
            setLoading(false);
          }
        }
      }
    } catch (e: any) {
      toast.show(e.message || 'Error al seleccionar imagen', 'error');
    }
  }

  async function onContinue() {
    if (!ocrPreview || !voucherUri) {
      toast.show('Selecciona un comprobante primero', 'error');
      return;
    }
    try {
      setLoading(true);
      const orderId = order?._id || order?.id;
      await OrdersApi(API).submitPaymentOCR(orderId, {
        amount: ocrPreview.detectedAmount || 0,
        method: 'Transferencia',
        receiptUrl: ocrPreview.receipt?.receiptUrl || '',
        ocrText: ocrPreview.receipt?.ocrText || '',
      });
      toast.show('Pago enviado correctamente', 'success');
      setModalVisible(true);
    } catch (e: any) {
      toast.show(e.message || 'Error al enviar pago', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Realiza el pago de tus pedidos</Text>

      {order && (
        <View style={[styles.orderInfo, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.infoLabel, { color: theme.colors.muted }]}>Total: <Text style={[styles.infoValue, { color: theme.colors.text }]}>${order.total || 0}</Text></Text>
          <Text style={[styles.infoLabel, { color: theme.colors.muted }]}>Pagado: <Text style={[styles.infoValue, { color: theme.colors.text }]}>${order.paid || 0}</Text></Text>
          <Text style={[styles.infoLabel, { color: theme.colors.muted }]}>Restante: <Text style={[styles.infoValue, { color: '#ef4444', fontWeight: '800' }]}>${order.restante || order.total || 0}</Text></Text>
        </View>
      )}

      <View style={styles.qrWrap}>
        {voucherUri ? (
          <>
            <Image source={{ uri: voucherUri }} style={styles.qrImage} resizeMode="cover" />
            <TouchableOpacity style={styles.clearBtn} onPress={() => { setVoucherUri(null); setOcrPreview(null); }}>
              <Ionicons name="trash" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Image source={{ uri: qrs[qrIndex] }} style={styles.qrImage} />
            <View style={styles.pagerRow}>
              <TouchableOpacity
                onPress={onPrev}
                style={[styles.navBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              >
                <Ionicons name="arrow-back" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {qrs.map((_, i) => (
                  <View key={i} style={[styles.dot, i === qrIndex && styles.dotActive]} />
                ))}
              </View>
              <TouchableOpacity
                onPress={onNext}
                style={[styles.navBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              >
                <Ionicons name="arrow-forward" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {ocrPreview && (
        <View style={[styles.ocrCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.ocrTitle, { color: theme.colors.text }]}>📄 Comprobante detectado</Text>
          <Text style={[styles.ocrLabel, { color: theme.colors.muted }]}>Monto detectado: <Text style={[styles.ocrValue, { color: theme.colors.text }]}>${ocrPreview.detectedAmount || 0}</Text></Text>
          <Text style={[styles.ocrLabel, { color: theme.colors.muted }]}>Restante después: <Text style={[styles.ocrValue, { color: theme.colors.text }]}>${ocrPreview.projected?.restanteAfter || 0}</Text></Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.actionBtn, loading && { opacity: 0.6 }]}
        onPress={voucherUri ? onContinue : pickVoucher}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionText}>{voucherUri ? 'Enviar pago' : 'Adjuntar comprobante de pago'}</Text>
        )}
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="checkmark-circle" size={36} color="#16a34a" />
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Pago listo</Text>
            <Text style={[styles.modalText, { color: theme.colors.muted }]}>Espera que el administrador lo valide</Text>
            <TouchableOpacity style={[styles.actionBtn, { marginTop: 16 }]} onPress={() => { setModalVisible(false); navigation.popToTop(); }}>
              <Text style={styles.actionText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const BROWN = '#6b4028';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontWeight: '800', fontSize: 18, textAlign: 'center', marginTop: 8, marginBottom: 12 },
  orderInfo: { padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  infoLabel: { fontSize: 14, marginBottom: 4 },
  infoValue: { fontWeight: '700' },
  qrWrap: { alignItems: 'center', marginTop: 12 },
  qrImage: { width: 260, height: 260, borderRadius: 12 },
  pagerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#6b4028' },
  dotActive: { backgroundColor: '#6b4028' },
  navBtn: { padding: 8, borderRadius: 999, borderWidth: 1 },
  clearBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: '#ef4444', padding: 8, borderRadius: 999 },
  ocrCard: { padding: 12, borderRadius: 12, marginTop: 16, borderWidth: 1 },
  ocrTitle: { fontWeight: '800', fontSize: 16, marginBottom: 8 },
  ocrLabel: { fontSize: 14, marginBottom: 4 },
  ocrValue: { fontWeight: '700' },
  actionBtn: { backgroundColor: BROWN, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', alignSelf: 'center', marginTop: 16, minWidth: 260 },
  actionText: { color: '#fff', fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { borderRadius: 16, padding: 20, alignItems: 'center', width: 300, borderWidth: 1 },
  modalTitle: { fontWeight: '800', fontSize: 18, marginTop: 8, marginBottom: 6 },
  modalText: {},
});





