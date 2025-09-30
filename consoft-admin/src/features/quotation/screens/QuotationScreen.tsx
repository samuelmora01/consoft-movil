import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/theme';
import { scale, moderateScale, responsiveFontSize } from '../../../theme/responsive';
import { useAppStore } from '../../../store/appStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useToast } from '../../../ui/ToastProvider';

export default function QuotationScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const toast = useToast();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [observation, setObservation] = React.useState('');
  const [clientName, setClientName] = React.useState('');
  const [clientEmail, setClientEmail] = React.useState('');
  const [draftItems, setDraftItems] = React.useState<Array<{ id: string; name: string; price: number; observations?: string }>>([]);
  const [draftDeliveryISO, setDraftDeliveryISO] = React.useState<string | undefined>(undefined);

  const createDocument = useAppStore((s) => s.createDocument);
  const addItemToDocument = useAppStore((s) => s.addItemToDocument);
  const finalizeQuotation = useAppStore((s) => s.finalizeQuotation);
  const setDeliveryDate = useAppStore((s) => s.setDeliveryDate);
  // Creation/edit screen does not change estado ni imágenes
  const documents = useAppStore((s) => s.documents);

  // Si llega documentId, editamos; si no, trabajamos en memoria hasta finalizar
  const docIdParam = route.params?.documentId as string | undefined;
  const doc = React.useMemo(() => documents.find((d) => d.id === docIdParam), [documents, docIdParam]);

  const addService = () => {
    const parsed = Number(price.replace(/[^0-9.]/g, '')) || 0;
    if (parsed <= 0) return;
    const nextName = name && name.trim().length > 0 ? name.trim() : `Servicio #${Math.floor(Math.random()*1000)}`;
    if (doc) {
      addItemToDocument(doc.id, { name: nextName, price: parsed, observations: observation });
    } else {
      setDraftItems((prev) => [...prev, { id: Math.random().toString(36).slice(2), name: nextName, price: parsed, observations: observation }]);
    }
    setName('');
    setPrice('');
    setObservation('');
    setModalVisible(false);
    toast.show('Servicio agregado', 'success');
  };

  const itemsToShow = doc?.items ?? draftItems;
  const total = (itemsToShow ?? []).reduce((sum, s) => sum + s.price, 0);

  // No image picking on creation screen

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <Text style={[styles.title, { color: theme.colors.text, fontSize: responsiveFontSize(18) }]}>Pedido</Text>
      <Text style={{ color: theme.colors.muted, marginBottom: 8, fontSize: responsiveFontSize(12) }}>*Nombre y Apellidos</Text>
      <TextInput placeholder="Nombre del cliente" value={clientName} onChangeText={setClientName} placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, padding: moderateScale(12), borderRadius: theme.radius }]} />
      <Text style={{ color: theme.colors.muted, marginBottom: 8, fontSize: responsiveFontSize(12) }}>Correo</Text>
      <TextInput placeholder="correo@correo" value={clientEmail} onChangeText={setClientEmail} keyboardType="email-address" placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, padding: moderateScale(12), borderRadius: theme.radius }]} />

      {/* Fecha de entrega se mostrará debajo de los servicios */}

      {/* En creación no se muestran estado ni imágenes */}

      <Text style={[styles.title, { color: theme.colors.text, fontSize: responsiveFontSize(18) }]}>Servicios</Text>
      {(itemsToShow ?? []).map((s) => (
        <View key={(s as any).id} style={[styles.row, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: moderateScale(14) }]}>
          <Text style={{ color: theme.colors.text, fontSize: responsiveFontSize(14) }}>{s.name}</Text>
          <Text style={{ color: theme.colors.text, fontSize: responsiveFontSize(14) }}>${s.price.toLocaleString()}</Text>
        </View>
      ))}
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderRadius: theme.radius, padding: moderateScale(14) }]} onPress={() => setModalVisible(true)}>
        <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Agregar servicio</Text>
      </TouchableOpacity>

      {/* Fecha de entrega (debajo de servicios) */}
      <Text style={[styles.title, { color: theme.colors.text, fontSize: responsiveFontSize(16), marginTop: 8 }]}>Fecha de entrega</Text>
      <DeliveryCalendar
        theme={theme}
        selectedISO={doc?.deliveryDate ?? draftDeliveryISO}
        size="sm"
        onChange={(iso) => {
          if (doc) {
            setDeliveryDate(doc.id, iso);
            toast.show('Fecha de entrega asignada', 'success');
          } else {
            setDraftDeliveryISO(iso);
          }
        }}
      />

      <View style={styles.totalRow}>
        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(16) }}>Total: ${total.toLocaleString()}</Text>
        <TouchableOpacity style={[styles.finishBtn, { backgroundColor: theme.colors.success, borderRadius: theme.radius, paddingVertical: moderateScale(12), paddingHorizontal: moderateScale(16) }]} onPress={() => {
          let targetId = doc?.id;
          if (!targetId) {
            const created = createDocument('client-1');
            targetId = created.id;
            draftItems.forEach((it) => addItemToDocument(targetId!, { name: it.name, price: it.price, observations: it.observations }));
            if (draftDeliveryISO) {
              setDeliveryDate(targetId!, draftDeliveryISO);
            }
          }
          useAppStore.setState((s) => ({ documents: s.documents.map((d) => d.id === targetId ? { ...d, clientName, clientEmail } : d) }));
          finalizeQuotation(targetId!);
          toast.show('Pedido finalizado', 'success');
          navigation.goBack();
        }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdropClickable} onPress={() => setModalVisible(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.modalSheet, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.sheetHandle} />
              <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: responsiveFontSize(16) }]}>Servicio</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Nombre del servicio" placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, padding: moderateScale(12), borderRadius: theme.radius }]} />
              <TextInput value={price} onChangeText={setPrice} placeholder="Valor" keyboardType="numeric" placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, padding: moderateScale(12), borderRadius: theme.radius }]} />
              <TextInput value={observation} onChangeText={setObservation} placeholder="Observación (opcional)" placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, padding: moderateScale(12), borderRadius: theme.radius }]} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.colors.border, borderRadius: theme.radius, paddingVertical: moderateScale(12), paddingHorizontal: moderateScale(16) }]} onPress={() => setModalVisible(false)}>
                  <Text style={{ color: theme.colors.text }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.radius, paddingVertical: moderateScale(12), paddingHorizontal: moderateScale(16) }]} onPress={addService}>
                  <Text style={{ color: '#fff' }}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderWidth: 1, borderRadius: 12, marginBottom: 10 },
  addBtn: { padding: 14, borderWidth: 1, borderRadius: 12, alignItems: 'center', marginVertical: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finishBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  backdropClickable: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, padding: 16, gap: 12, minHeight: '70%' },
  sheetHandle: { alignSelf: 'center', width: 136, height: 4, borderRadius: 2, backgroundColor: '#A0A0A0', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', flex: 1 },
  input: { borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 10 },
  statusCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  imageSlot: { flex: 1, height: 80, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  changeStateBtn: { marginTop: 12, borderWidth: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  calendarCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  monthLabel: { fontWeight: '700' },
});


type DeliveryCalendarProps = {
  theme: any;
  selectedISO?: string;
  onChange: (iso: string) => void;
  size?: 'sm' | 'md';
};

function DeliveryCalendar({ theme, selectedISO, onChange, size = 'md' }: DeliveryCalendarProps) {
  const [monthDate, setMonthDate] = React.useState(() => {
    return selectedISO ? new Date(selectedISO) : new Date();
  });

  React.useEffect(() => {
    if (selectedISO) {
      const d = new Date(selectedISO);
      setMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [selectedISO]);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const startWeekday = start.getDay();
  const daysInMonth = end.getDate();

  const daysArray: Array<{ label: string; date?: Date }> = [];
  for (let i = 0; i < startWeekday; i++) daysArray.push({ label: '', date: undefined });
  for (let d = 1; d <= daysInMonth; d++) daysArray.push({ label: String(d), date: new Date(year, month, d) });

  const selectedDate = selectedISO ? new Date(selectedISO) : undefined;
  const selectedY = selectedDate?.getFullYear();
  const selectedM = selectedDate?.getMonth();
  const selectedD = selectedDate?.getDate();

  function formatISO(d: Date) {
    const atNoon = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
    return atNoon.toISOString();
  }

  const monthName = monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const weekLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  const daySize = size === 'sm' ? 28 : 36;
  const fontSize = size === 'sm' ? responsiveFontSize(10) : responsiveFontSize(11);

  return (
    <View style={[styles.calendarCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, borderRadius: theme.radius }]}> 
      <View style={styles.calendarHeader}>
        <TouchableOpacity style={[styles.navBtn, { borderColor: theme.colors.border, width: daySize, height: daySize, borderRadius: daySize/2 }]} onPress={() => setMonthDate(new Date(year, month - 1, 1))}>
          <Ionicons name="chevron-back" size={size === 'sm' ? 16 : 18} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: theme.colors.text, fontSize: size === 'sm' ? responsiveFontSize(12) : responsiveFontSize(14) }]}>{monthName}</Text>
        <TouchableOpacity style={[styles.navBtn, { borderColor: theme.colors.border, width: daySize, height: daySize, borderRadius: daySize/2 }]} onPress={() => setMonthDate(new Date(year, month + 1, 1))}>
          <Ionicons name="chevron-forward" size={size === 'sm' ? 16 : 18} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekHeader}>
        {weekLabels.map((w) => (
          <Text key={w} style={{ color: theme.colors.muted, width: `${100 / 7}%`, textAlign: 'center', fontSize: fontSize }}>{w}</Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }}>
        {daysArray.map((d, idx) => {
          const isSelected = d.date && d.date.getFullYear() === selectedY && d.date.getMonth() === selectedM && d.date.getDate() === selectedD;
          return (
            <View key={idx} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
              <TouchableOpacity
                disabled={!d.date}
                onPress={() => d.date && onChange(formatISO(d.date))}
                style={{
                  width: daySize,
                  height: daySize,
                  borderRadius: daySize/2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: isSelected ? theme.colors.primary + '22' : 'transparent',
                }}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: size === 'sm' ? responsiveFontSize(11) : undefined }}>{d.label}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

