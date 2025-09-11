import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '../ui/ToastProvider';

export default function OrderPaymentScreen({ route, navigation }: any) {
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

  const onPrev = () => setQrIndex((i) => (i - 1 + qrs.length) % qrs.length);
  const onNext = () => setQrIndex((i) => (i + 1) % qrs.length);

  async function pickVoucher() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets?.length) setVoucherUri(res.assets[0].uri);
  }

  function onContinue() {
    toast.show('Completado', 'success');
    setModalVisible(true);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Realiza el pago de tus pedidos</Text>

      <View style={styles.qrWrap}>
        {voucherUri ? (
          <>
            <Image source={{ uri: voucherUri }} style={styles.qrImage} resizeMode="cover" />
            <TouchableOpacity style={styles.clearBtn} onPress={() => setVoucherUri(null)}>
              <Ionicons name="trash" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Image source={{ uri: qrs[qrIndex] }} style={styles.qrImage} />
            <View style={styles.pagerRow}>
              <TouchableOpacity onPress={onPrev} style={styles.navBtn}><Ionicons name="arrow-back" size={18} color="#6b4028" /></TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {qrs.map((_, i) => (
                  <View key={i} style={[styles.dot, i === qrIndex && styles.dotActive]} />
                ))}
              </View>
              <TouchableOpacity onPress={onNext} style={styles.navBtn}><Ionicons name="arrow-forward" size={18} color="#6b4028" /></TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={voucherUri ? onContinue : pickVoucher}
      >
        <Text style={styles.actionText}>{voucherUri ? 'Continuar' : 'Adjuntar comprobante de pago'}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Ionicons name="checkmark-circle" size={36} color="#16a34a" />
            <Text style={styles.modalTitle}>Pago listo</Text>
            <Text style={styles.modalText}>Espera que el administrador lo valide</Text>
            <TouchableOpacity style={[styles.actionBtn, { marginTop: 16 }]} onPress={() => { setModalVisible(false); navigation.popToTop(); }}>
              <Text style={styles.actionText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const BROWN = '#6b4028';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { color: BROWN, fontWeight: '800', fontSize: 18, textAlign: 'center', marginTop: 8, marginBottom: 12 },
  qrWrap: { alignItems: 'center', marginTop: 12 },
  qrImage: { width: 260, height: 260, borderRadius: 12 },
  pagerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#6b4028' },
  dotActive: { backgroundColor: '#6b4028' },
  navBtn: { padding: 8, borderRadius: 999, backgroundColor: '#ede3dc' },
  clearBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: '#ef4444', padding: 8, borderRadius: 999 },
  actionBtn: { backgroundColor: BROWN, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', alignSelf: 'center', marginTop: 16, minWidth: 260 },
  actionText: { color: '#fff', fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', width: 300 },
  modalTitle: { fontWeight: '800', fontSize: 18, marginTop: 8, marginBottom: 6 },
  modalText: { color: '#374151' },
});





