import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { useAppStore } from '../../../store/appStore';
import { Appointment, AppointmentStatus } from '../../../domain/types';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const appointments = useAppStore((s) => s.appointments);
  const createAppointment = useAppStore((s) => s.createAppointment);
  const setStatus = useAppStore((s) => s.setAppointmentStatus);
  const [tab, setTab] = useState<'Pendientes' | 'Confirmados'>('Pendientes');
  const [nameQ, setNameQ] = useState('');
  const [dateQ, setDateQ] = useState('');

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
      <TextInput value={dateQ} onChangeText={setDateQ} placeholder="Filtrar por fecha" placeholderTextColor={theme.colors.muted} style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]} />

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
      <TouchableOpacity onPress={() => { const now = new Date(); now.setMinutes(now.getMinutes()+30); const created = createAppointment({ title: 'Nueva visita', clientId: 'client-demo', datetimeISO: now.toISOString() }); navigation.navigate('AppointmentDetail', { id: created.id }); }} style={[styles.fab, { backgroundColor: theme.colors.primary }]}> 
        <Text style={{ color: '#fff', fontWeight: '700' }}>Crear cita</Text>
      </TouchableOpacity>
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
});


