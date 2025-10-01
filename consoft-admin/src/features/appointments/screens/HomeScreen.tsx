import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useAppStore } from '../../../store/appStore';
import { Appointment, AppointmentStatus } from '../../../domain/types';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { responsiveFontSize } from '../../../theme/responsive';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppointmentMap from '../components/AppointmentMap';

export default function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const appointments = useAppStore((s) => s.appointments);
  const createAppointment = useAppStore((s) => s.createAppointment);
  const setStatus = useAppStore((s) => s.setAppointmentStatus);
  const [tab, setTab] = useState<'Pendientes' | 'Confirmados'>('Pendientes');
  const [nameQ, setNameQ] = useState('');
  const [dateQ, setDateQ] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [tmpDate, setTmpDate] = useState<string | undefined>(undefined);
  // Creation moved to dedicated screen

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const statusOk = tab === 'Pendientes' ? a.status === AppointmentStatus.Pending : a.status === AppointmentStatus.Confirmed;
      const nameOk = nameQ ? a.title.toLowerCase().includes(nameQ.toLowerCase()) : true;
      const dateOk = dateQ ? new Date(a.datetime).toDateString().includes(new Date(dateQ).toDateString()) : true;
      return statusOk && nameOk && dateOk;
    });
  }, [appointments, tab, nameQ, dateQ]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.tabs, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
        {(['Pendientes','Confirmados'] as const).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && { backgroundColor: theme.colors.primary }]}> 
            <Text style={{ color: tab === t ? '#fff' : theme.colors.text, fontWeight: '700' }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput value={nameQ} onChangeText={setNameQ} placeholder="¿nombre del cliente?" placeholderTextColor={theme.colors.muted} style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]} />
      <TextInput value={dateQ} onFocus={() => { setTmpDate(dateQ || undefined); setShowDateModal(true); }} onChangeText={setDateQ} placeholder="Filtrar por fecha" placeholderTextColor={theme.colors.muted} style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]} />

      <TouchableOpacity style={[styles.searchBtn, { backgroundColor: theme.colors.primary }]}> 
        <Text style={{ color: '#fff', fontWeight: '700' }}>Buscar</Text>
      </TouchableOpacity>

      <FlatList
        data={filtered}
        keyExtractor={(a: Appointment) => a.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}
        ListFooterComponent={<View style={{ height: 16 }} />}
        renderItem={({ item: a }) => (
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('AppointmentDetail', { id: a.id })} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{a.title}</Text>
            <Text style={{ color: theme.colors.muted }}>servicios 3</Text>
            <Text style={{ color: theme.colors.text, fontWeight: '700', position: 'absolute', right: 16, top: 16 }}>{new Date(a.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            {a.status === AppointmentStatus.Pending && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity onPress={() => setStatus(a.id, AppointmentStatus.Confirmed)} style={[styles.pill, { backgroundColor: theme.colors.success }]}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStatus(a.id, AppointmentStatus.Cancelled)} style={[styles.pill, { backgroundColor: theme.colors.danger }]}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity onPress={() => navigation.navigate('AppointmentCreate')} style={[styles.fab, { backgroundColor: theme.colors.primary }]}> 
        <Text style={{ color: '#fff', fontWeight: '700' }}>Crear visita</Text>
      </TouchableOpacity>

      {/* Date filter modal */}
      <Modal visible={showDateModal} transparent animationType="slide" onRequestClose={() => setShowDateModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDateModal(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={[styles.sheet, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
            <View style={styles.sheetHandle} />
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 8 }}>Filtrar por fecha</Text>
            <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>Selecciona una fecha</Text>
            <InlineCalendar
              theme={theme}
              selectedISO={tmpDate}
              onChange={(iso) => setTmpDate(iso)}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity style={[styles.sheetBtn, { borderColor: theme.colors.border }]} onPress={() => setShowDateModal(false)}>
                <Text style={{ color: theme.colors.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: theme.colors.primary }]} onPress={() => { setDateQ(tmpDate ?? ''); setShowDateModal(false); }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/** creation moved to screen **/}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 18, marginBottom: 12 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 14 },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  searchBtn: { alignItems: 'center', paddingVertical: 10, borderRadius: 10, marginBottom: 12 },
  card: { padding: 14, borderRadius: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12 },
  fab: { position: 'absolute', right: 16, bottom: 16, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16 },
  modalBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, padding: 16, gap: 10 },
  sheetHandle: { alignSelf: 'center', width: 136, height: 4, borderRadius: 2, backgroundColor: '#A0A0A0', marginBottom: 10 },
  sheetBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderRadius: 12 },
});


type InlineCalendarProps = {
  theme: any;
  selectedISO?: string;
  onChange: (iso: string) => void;
};

function InlineCalendar({ theme, selectedISO, onChange }: InlineCalendarProps) {
  const [monthDate, setMonthDate] = React.useState(() => (selectedISO ? new Date(selectedISO) : new Date()));

  React.useEffect(() => {
    if (selectedISO) {
      const d = new Date(selectedISO);
      setMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [selectedISO]);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const start = new Date(year, month, 1);
  const startDay = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(1 - startDay);
  const days: Date[] = Array.from({ length: 42 }).map((_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const selectedDate = selectedISO ? new Date(selectedISO) : undefined;
  const isSameDay = (a: Date, b?: Date) => !!b && a.toDateString() === b.toDateString();

  function formatISO(d: Date) {
    const atNoon = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
    return atNoon.toISOString();
  }

  const monthLabel = monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <TouchableOpacity style={{ borderWidth: 1, borderColor: theme.colors.border, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }} onPress={() => setMonthDate(new Date(year, month - 1, 1))}>
          <Ionicons name="chevron-back" size={16} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(14) }}>{monthLabel}</Text>
        <TouchableOpacity style={{ borderWidth: 1, borderColor: theme.colors.border, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }} onPress={() => setMonthDate(new Date(year, month + 1, 1))}>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d) => (
          <Text key={d} style={{ color: theme.colors.muted, width: `${100 / 7}%`, textAlign: 'center', fontSize: responsiveFontSize(11) }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {days.map((d) => {
          const inMonth = d.getMonth() === month;
          const selected = isSameDay(d, selectedDate);
          return (
            <View key={d.toISOString()} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => onChange(formatISO(d))}
                style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: selected ? theme.colors.primary : theme.colors.border, backgroundColor: selected ? theme.colors.primary + '22' : 'transparent' }}
              >
                <Text style={{ color: inMonth ? theme.colors.text : theme.colors.muted, fontWeight: '700', fontSize: responsiveFontSize(12) }}>{d.getDate()}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

