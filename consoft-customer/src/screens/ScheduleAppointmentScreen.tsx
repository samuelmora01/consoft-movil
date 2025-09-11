import React, { useMemo, useState } from 'react';
import { useToast } from '../ui/ToastProvider';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  route: { params?: { item?: { title?: string } } };
  navigation: any;
};

function generateMonthMatrix(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const startWeekday = firstDay.getDay(); // 0=Sun
  const numDays = new Date(year, monthIndex + 1, 0).getDate();

  const weeks: Array<Array<{ d: number | null; date?: Date }>> = [];
  let week: Array<{ d: number | null; date?: Date }> = [];

  // pad start
  for (let i = 0; i < startWeekday; i += 1) {
    week.push({ d: null });
  }

  for (let day = 1; day <= numDays; day += 1) {
    const date = new Date(year, monthIndex, day);
    week.push({ d: day, date });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push({ d: null });
    weeks.push(week);
  }
  return weeks;
}

const HOURS = Array.from({ length: 12 }).map((_, i) => {
  const hour = 8 + i; // 08 to 19
  const label = `${hour.toString().padStart(2, '0')}:00`;
  return label;
});

export default function ScheduleAppointmentScreen({ route, navigation }: Props) {
  const productTitle = route?.params?.item?.title ?? 'Agendar una cita con nosotros';
  const toast = useToast();

  const today = new Date();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<string>('17:00');
  const [openCalendar, setOpenCalendar] = useState(false);
  const [openHourPicker, setOpenHourPicker] = useState(false);
  const [monthIndex, setMonthIndex] = useState<number>(today.getMonth());
  const [year, setYear] = useState<number>(today.getFullYear());

  const weeks = useMemo(() => generateMonthMatrix(year, monthIndex), [monthIndex, year]);

  const onPrevMonth = () => {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear((y) => y - 1);
    } else setMonthIndex((m) => m - 1);
  };
  const onNextMonth = () => {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear((y) => y + 1);
    } else setMonthIndex((m) => m + 1);
  };

  const monthLabel = useMemo(
    () => new Date(year, monthIndex, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [monthIndex, year]
  );

  const submit = () => {
    if (!name || !selectedDate || !selectedHour) {
      toast.show('Completa nombre, fecha y hora', 'error');
      return;
    }
    const dateStr = selectedDate.toISOString().split('T')[0];
    toast.show('Cita solicitada', 'success');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agenda una cita con nosotros</Text>

      <View style={styles.field}>
        <Text style={styles.label}>* Nombre y apellidos</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Tu nombre" style={styles.input} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Correo</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="correo@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Celular</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="300 000 0000" keyboardType="phone-pad" style={styles.input} />
      </View>

      <TouchableOpacity style={styles.dateButton} onPress={() => setOpenCalendar(true)}>
        <Text style={styles.dateButtonText}>{selectedDate ? selectedDate.toLocaleDateString() : 'Selecciona una fecha'}</Text>
      </TouchableOpacity>

      <Text style={[styles.label, { marginTop: 14 }]}>Hora</Text>
      <TouchableOpacity style={styles.timeRow} onPress={() => setOpenHourPicker(true)}>
        <Text style={{ color: '#333' }}>{selectedHour}</Text>
        <Ionicons name="chevron-down" size={18} color="#6b4028" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.submit} onPress={submit}>
        <Text style={styles.submitText}>Agendar</Text>
      </TouchableOpacity>

      <Modal visible={openCalendar} transparent animationType="fade" onRequestClose={() => setOpenCalendar(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.calendarCard}>
            <Text style={styles.calendarTitle}>Selecciona una fecha</Text>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={onPrevMonth}>
                <Ionicons name="chevron-back" size={20} color="#6b4028" />
              </TouchableOpacity>
              <Text style={styles.monthText}>{monthLabel}</Text>
              <TouchableOpacity onPress={onNextMonth}>
                <Ionicons name="chevron-forward" size={20} color="#6b4028" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekHeader}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <Text key={d} style={styles.weekHeaderText}>{d}</Text>
              ))}
            </View>

            {weeks.map((w, wi) => (
              <View key={wi} style={styles.weekRow}>
                {w.map((cell, ci) => {
                  const isSelected = cell.date && selectedDate && cell.date.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={`${wi}-${ci}`}
                      style={[styles.dayCell, isSelected && styles.daySelected]}
                      disabled={!cell.d}
                      onPress={() => {
                        if (!cell.date) return;
                        setSelectedDate(cell.date);
                        setOpenCalendar(false);
                      }}
                    >
                      <Text style={[styles.dayText, !cell.d && { opacity: 0 }, isSelected && { color: '#fff' }]}>
                        {cell.d ?? ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={openHourPicker} transparent animationType="fade" onRequestClose={() => setOpenHourPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.timeCard}>
            <FlatList
              data={HOURS}
              keyExtractor={(k) => k}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.timeItem}
                  onPress={() => {
                    setSelectedHour(item);
                    setOpenHourPicker(false);
                  }}
                >
                  <Text style={{ color: '#333' }}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const BROWN = '#6b4028';
const LIGHT = '#f3ece7';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  field: { marginBottom: 12 },
  label: { fontWeight: '600', color: '#4c3d32', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e6ded8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  dateButton: { backgroundColor: BROWN, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  dateButtonText: { color: '#fff', fontWeight: '700' },
  timeRow: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6ded8',
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submit: { marginTop: 24, backgroundColor: BROWN, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  calendarCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16 },
  calendarTitle: { fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthText: { fontWeight: '700', color: '#4c3d32' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 6 },
  weekHeaderText: { width: 32, textAlign: 'center', color: '#6c5b4e' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 6 },
  dayCell: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: BROWN },
  dayText: { color: '#4c3d32' },

  timeCard: { backgroundColor: '#fff', borderRadius: 16, maxHeight: 320, paddingVertical: 8 },
  timeItem: { paddingVertical: 12, paddingHorizontal: 16 },
});


