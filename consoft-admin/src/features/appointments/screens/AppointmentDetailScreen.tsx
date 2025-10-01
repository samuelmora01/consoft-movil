import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ScrollView, TextInput } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppStore, AppState } from '../../../store/appStore';
import { Appointment } from '../../../domain/types';
import { cancelAppointment, confirmAppointment, rescheduleAppointment as rescheduleSvc } from '../appointmentsService';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppointmentMap from '../components/AppointmentMap.native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale, responsiveFontSize } from '../../../theme/responsive';
import { useToast } from '../../../ui/ToastProvider';


type RouteParams = { id: string };

export default function AppointmentDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const toast = useToast();
  const { id } = (route.params as RouteParams) || { id: '' };
  const appointment = useAppStore((s: AppState) => s.appointments.find((a) => a.id === id)) as Appointment | undefined;
  const updateLocation = useAppStore((s: AppState) => s.updateAppointmentLocation);
  const [date, setDate] = useState<Date>(() => (appointment ? new Date(appointment.datetime) : new Date()));
  const [time, setTime] = useState<Date>(() => (appointment ? new Date(appointment.datetime) : new Date()));
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date(date.getFullYear(), date.getMonth(), 1));

  function minutesSinceEpoch(d: Date): number {
    return Math.floor(d.getTime() / 60000);
  }

  function mergeDateAndTime(d: Date, t: Date): Date {
    const merged = new Date(d);
    merged.setHours(t.getHours(), t.getMinutes(), 0, 0);
    merged.setSeconds(0, 0);
    return merged;
  }

  const initialMinuteRef = useRef<number>(0);
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    let base: Date;
    if (appointment?.datetime) {
      base = new Date(appointment.datetime);
    } else {
      base = mergeDateAndTime(date, time);
    }
    base.setSeconds(0, 0);
    initialMinuteRef.current = minutesSinceEpoch(base);
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id]);

  const mergedNow = useMemo(() => mergeDateAndTime(date, time), [date, time]);
  const combinedISO = useMemo(() => mergedNow.toISOString(), [mergedNow]);
  const hasDateChanged = useMemo(() => initialized && minutesSinceEpoch(mergedNow) !== initialMinuteRef.current, [initialized, mergedNow]);

  const monthLabel = useMemo(() =>
    calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
  [calendarMonth]);

  const monthDays: Date[] = useMemo(() => {
    const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const startDay = start.getDay(); // 0 Sun ... 6 Sat
    const gridStart = new Date(start);
    gridStart.setDate(1 - startDay);
    const days: Date[] = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [calendarMonth]);

  if (!appointment) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }] }>
        <Text style={{ color: theme.colors.text }}>Cita no encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <Text style={[styles.title, { color: theme.colors.text, fontSize: responsiveFontSize(18) }]}>Cita</Text>
      <View style={[styles.infoCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderRadius: theme.radius, padding: moderateScale(12) }]}> 
        <Text style={[styles.infoLabel, { color: theme.colors.muted, fontSize: responsiveFontSize(12) }]}>*Nombre y Apellidos</Text>
        <TextInput
          value={appointment.title}
          onChangeText={(t) => useAppStore.setState((s) => ({ appointments: s.appointments.map((a) => a.id === appointment.id ? { ...a, title: t, updatedAt: new Date().toISOString() } : a) }))}
          placeholder="Nombre y apellidos"
          placeholderTextColor={theme.colors.muted}
          style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius, padding: 12, color: theme.colors.text, backgroundColor: theme.colors.card }}
        />
        <Text style={[styles.infoLabel, { color: theme.colors.muted, marginTop: 8, fontSize: responsiveFontSize(12) }]}>Dirección</Text>
        <TextInput
          value={appointment.address ?? ''}
          onChangeText={(t) => useAppStore.setState((s) => ({ appointments: s.appointments.map((a) => a.id === appointment.id ? { ...a, address: t, updatedAt: new Date().toISOString() } : a) }))}
          placeholder="Dirección"
          placeholderTextColor={theme.colors.muted}
          style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius, padding: 12, color: theme.colors.text, backgroundColor: theme.colors.card }}
        />
      </View>
      <View style={[styles.mapContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, borderRadius: theme.radius, height: verticalScale(160) }]}> 
        <AppointmentMap
          latitude={appointment.location ? appointment.location.coordinates[1] : 52.4862}
          longitude={appointment.location ? appointment.location.coordinates[0] : -1.8904}
          draggable
          onChangeLocation={(lon, lat) => updateLocation(appointment.id, lon, lat)}
        />
      </View>
      <Text style={{ color: theme.colors.muted, marginTop: 8, marginBottom: 6, fontSize: responsiveFontSize(12) }}>Fecha y Hora</Text>
      <View style={[styles.calendarCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderRadius: theme.radius, padding: moderateScale(12) }]}> 
        <Text style={[styles.calendarTitle, { color: theme.colors.text, fontSize: responsiveFontSize(14) }]}>Fecha y Hora</Text>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} style={[styles.navBtn, { borderColor: theme.colors.border, borderRadius: theme.radius }]}> 
            <Ionicons name="chevron-back" size={responsiveFontSize(18)} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: theme.colors.text, fontSize: responsiveFontSize(14) }]}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} style={[styles.navBtn, { borderColor: theme.colors.border, borderRadius: theme.radius }]}> 
            <Ionicons name="chevron-forward" size={responsiveFontSize(18)} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.weekHeaderRow}>
          {['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'].map((d) => (
            <Text key={d} style={[styles.weekHeader, { color: theme.colors.muted, fontSize: responsiveFontSize(10) }]}>{d}</Text>
          ))}
        </View>
        <View style={styles.grid}>
          {monthDays.map((d) => {
            const inMonth = d.getMonth() === calendarMonth.getMonth();
            const isSelected = d.toDateString() === new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString();
            return (
              <TouchableOpacity
                key={d.toISOString()}
                onPress={() => {
                  const merged = new Date(d);
                  merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
                  setDate(merged);
                }}
                style={[styles.dayCell, { width: scale(32), height: scale(32), borderRadius: moderateScale(16) }, isSelected ? { backgroundColor: theme.colors.primary } : undefined]}
              >
                <Text style={[styles.dayNum, { color: isSelected ? '#fff' : inMonth ? theme.colors.text : theme.colors.muted, fontSize: responsiveFontSize(12) }]}>{d.getDate()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.chip, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderRadius: theme.radius }]}> 
            <Text style={[styles.chipText, { color: theme.colors.primary, fontSize: responsiveFontSize(12) }]}>{date.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowTimePicker(true)} style={[styles.chip, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderRadius: theme.radius }]}> 
            <Text style={[styles.chipText, { color: theme.colors.primary, fontSize: responsiveFontSize(12) }]}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }}
          />
        )}
        <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
              <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: responsiveFontSize(16) }]}>Seleccionar hora</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.pickerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerLabel, { color: theme.colors.muted }]}>Hora</Text>
                    <View style={styles.optionsWrap}>
                      {Array.from({ length: 24 }).map((_, h) => {
                        const selected = h === time.getHours();
                        return (
                          <TouchableOpacity key={h} onPress={() => { const t = new Date(time); t.setHours(h); setTime(t); }} style={[styles.optionChip, { borderColor: theme.colors.border, backgroundColor: selected ? theme.colors.primary : 'transparent', borderRadius: theme.radius }]}> 
                            <Text style={{ color: selected ? '#fff' : theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(14) }}>{h.toString().padStart(2, '0')}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerLabel, { color: theme.colors.muted }]}>Min</Text>
                    <View style={styles.optionsWrap}>
                      {[0,5,10,15,20,25,30,35,40,45,50,55].map((m) => {
                        const selected = m === time.getMinutes() - (time.getMinutes() % 5);
                        return (
                          <TouchableOpacity key={m} onPress={() => { const t = new Date(time); t.setMinutes(m); setTime(t); }} style={[styles.optionChip, { borderColor: theme.colors.border, backgroundColor: selected ? theme.colors.primary : 'transparent', borderRadius: theme.radius }]}> 
                            <Text style={{ color: selected ? '#fff' : theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(14) }}>{m.toString().padStart(2, '0')}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              ) : (
                <DateTimePicker
                  value={time}
                  mode="time"
                  onChange={(_, t) => { if (t) setTime(t); }}
                  minuteInterval={5}
                />
              )}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.colors.border, borderRadius: theme.radius }]} onPress={() => setShowTimePicker(false)}>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: responsiveFontSize(14) }}>Listo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.colors.danger }]} onPress={async () => { await cancelAppointment(appointment.id); toast.show('Cita cancelada', 'info'); navigation.goBack(); }}>
          <Text style={styles.btnText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: hasDateChanged ? theme.colors.warning : theme.colors.primary }]}
          onPress={async () => {
            if (hasDateChanged) {
              await rescheduleSvc(appointment.id, combinedISO);
              toast.show('Cita re-agendada', 'success');
            } else {
              await confirmAppointment(appointment.id);
              toast.show('Cita confirmada', 'success');
            }
            navigation.goBack();
          }}
        > 
          <Text style={styles.btnText}>{hasDateChanged ? 'Re-agendar' : 'Confirmar'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  value: { fontSize: 16, marginBottom: 8 },
  infoCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  infoLabel: { fontSize: 12, fontWeight: '700' },
  infoName: { fontSize: 18, fontWeight: '700' },
  infoValue: { fontSize: 16 },
  mapContainer: { height: 180, borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 12, padding: 10 },
  mapMock: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  calendarCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 16 },
  calendarTitle: { fontWeight: '700' },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
  navBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  monthLabel: { fontWeight: '700' },
  weekHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  weekHeader: { width: 32, textAlign: 'center', fontSize: 10, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayCell: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  chip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  chipText: { fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', borderWidth: 1, borderRadius: 16, padding: 16 },
  modalTitle: { fontWeight: '700', marginBottom: 8 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderRadius: 12 },
  pickerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pickerLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderRadius: 10 },
});

// Light map style to match Figma-like clean look
const lightMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e6efe6' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f0f0f0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e6e6e6' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfdff6' }] },
];


