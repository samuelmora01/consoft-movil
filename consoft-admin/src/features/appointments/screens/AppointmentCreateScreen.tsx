import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { responsiveFontSize, moderateScale, verticalScale, scale } from '../../../theme/responsive';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppointmentMap from '../components/AppointmentMap';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../../store/appStore';

export default function AppointmentCreateScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const createAppointment = useAppStore((s) => s.createAppointment);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState<Date>(() => new Date());
  const [time, setTime] = useState<Date>(() => { const d = new Date(); d.setMinutes(d.getMinutes()+30); return d; });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState<{ lon: number; lat: number }>({ lon: -1.8904, lat: 52.4862 });

  const dateLabel = useMemo(() => date.toLocaleDateString('es-ES'), [date]);
  const timeLabel = useMemo(() => time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), [time]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: responsiveFontSize(18) }]}>Cita</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderRadius: theme.radius, padding: moderateScale(12) }]}> 
        <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(12) }}>*Nombre y Apellidos</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Nombre y apellidos" placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card, borderRadius: theme.radius }]} />
        <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(12), marginTop: 8 }}>Dirección</Text>
        <TextInput value={address} onChangeText={setAddress} placeholder="Dirección" placeholderTextColor={theme.colors.muted} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card, borderRadius: theme.radius }]} />
      </View>
      <View style={[styles.mapContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, borderRadius: theme.radius, height: verticalScale(160) }]}> 
        <AppointmentMap latitude={location.lat} longitude={location.lon} draggable onChangeLocation={(lon, lat) => setLocation({ lon, lat })} />
      </View>
      <Text style={{ color: theme.colors.muted, marginTop: 8, marginBottom: 6, fontSize: responsiveFontSize(12) }}>Fecha y Hora</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderRadius: theme.radius, padding: moderateScale(12) }]}> 
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.pickerBtn, { borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{dateLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowTimePicker(true)} style={[styles.pickerBtn, { borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{timeLabel}</Text>
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }} />
        )}
        {showTimePicker && (
          <DateTimePicker value={time} mode="time" onChange={(_, t) => { setShowTimePicker(false); if (t) setTime(t); }} minuteInterval={5} />
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <TouchableOpacity style={[styles.btnGhost, { borderColor: theme.colors.border }]} onPress={() => navigation.goBack()}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnFilled, { backgroundColor: theme.colors.primary }]} 
          onPress={() => {
            const merged = new Date(date);
            merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
            createAppointment({ title: name || 'Nueva visita', clientId: 'client-demo', datetimeISO: merged.toISOString(), address });
            navigation.navigate('AppointmentsHome');
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  input: { borderWidth: 1, padding: 12, borderRadius: 12, marginTop: 6 },
  mapContainer: { height: 160, borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  pickerBtn: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  btnGhost: { flex: 1, borderWidth: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  btnFilled: { flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
});


