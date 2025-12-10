import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { responsiveFontSize, moderateScale, verticalScale, scale } from '../../../theme/responsive';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppointmentMap from '../components/AppointmentMap';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../../store/appStore';
import { API } from '../../../config';
import { UsersApi } from '../../../api/client';

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
  const [clientQuery, setClientQuery] = useState('');
  const [clientOptions, setClientOptions] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const clientDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const dateLabel = useMemo(() => date.toLocaleDateString('es-ES'), [date]);
  const timeLabel = useMemo(() => time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), [time]);

  useEffect(() => {
    if (clientDebounceRef.current) {
      clearTimeout(clientDebounceRef.current);
      clientDebounceRef.current = null;
    }
    const q = clientQuery.trim();
    if (q.length < 2) {
      setClientOptions([]);
      return;
    }
    clientDebounceRef.current = setTimeout(async () => {
      try {
        if (!API) return;
        setClientLoading(true);
        const res = await UsersApi(API).search(q);
        const list = (res as any).users || [];
        const lowered = q.toLowerCase();
        const mapped = list.map((u: any) => ({ id: u._id || u.id, name: u.name, email: u.email }));
        const filtered = mapped.filter((u: any) => {
          const nameOk = (u.name || '').toLowerCase().includes(lowered);
          const emailOk = (u.email || '').toLowerCase().includes(lowered);
          return nameOk || emailOk;
        });
        setClientOptions(filtered);
        setShowClientDropdown(true);
      } catch {
        // ignore
      } finally {
        setClientLoading(false);
      }
    }, 250);
  }, [clientQuery]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: responsiveFontSize(18) }]}>Cita</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderRadius: theme.radius, padding: moderateScale(12) }]}> 
        <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(12) }}>*Nombre y Apellidos</Text>
        <View>
          <TextInput
            value={clientQuery}
            onChangeText={(t) => { setClientQuery(t); setShowClientDropdown(true); setName(t); }}
            placeholder="Buscar cliente por nombre"
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card, borderRadius: theme.radius }]}
          />
          {showClientDropdown && (clientOptions.length > 0 || clientLoading) ? (
            <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius, marginTop: -8, backgroundColor: theme.colors.card }}>
              {clientLoading ? (
                <View style={{ padding: 12 }}><Text style={{ color: theme.colors.muted }}>Buscando...</Text></View>
              ) : clientOptions.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => {
                    setSelectedClientId(u.id);
                    setClientQuery(u.name);
                    setName(u.name);
                    setShowClientDropdown(false);
                  }}
                  style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{u.name}</Text>
                  <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(11) }}>{u.email}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
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
          onPress={async () => {
            try {
              const merged = new Date(date);
              merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
              if (!selectedClientId) {
                return;
              }
              if (!API) throw new Error('Configura API');
              const { VisitsApi } = await import('../../../api/client');
              await VisitsApi(API).createForUser({
                user: selectedClientId,
                visitDate: merged.toISOString(),
                address,
                status: 'pendiente',
                services: [],
              });
              navigation.navigate('AppointmentsHome');
            } catch (e) {
              // keep on screen; optionally show a toast if needed
            }
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


