import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../theme/theme';
import { useAppStore, AppState } from '../../../store/appStore';
import { Appointment, AppointmentStatus } from '../../../domain/types';
import { confirmAppointment, cancelAppointment } from '../appointmentsService';
import { useToast } from '../../../ui/ToastProvider';
import { responsiveFontSize, moderateScale } from '../../../theme/responsive';

export default function AppointmentsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const toast = useToast();
  const [tab, setTab] = useState<'Pendientes' | 'Confirmadas'>('Pendientes');
  const appointments = useAppStore((s: AppState) => s.appointments);
  const setStatus = useAppStore((s: AppState) => s.setAppointmentStatus);
  const seed = useAppStore((s: AppState) => s.seedAppointments);
  const tabs: Array<'Pendientes' | 'Confirmadas'> = ['Pendientes', 'Confirmadas'];
  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === AppointmentStatus.Pending).length,
    [appointments],
  );
  const confirmedCount = useMemo(
    () => appointments.filter((a) => a.status === AppointmentStatus.Confirmed).length,
    [appointments],
  );
  const filtered = useMemo(
    () => appointments.filter((a) => (tab === 'Pendientes' ? a.status === AppointmentStatus.Pending : a.status === AppointmentStatus.Confirmed)),
    [appointments, tab],
  );
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }] }>
      <View style={[styles.tabs, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, paddingTop: moderateScale(8) }]}> 
        {tabs.map((t: 'Pendientes' | 'Confirmadas') => (
          <TouchableOpacity
            key={t}
            style={[
              styles.tab,
              tab === t ? { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 } : undefined,
            ]}
            onPress={() => setTab(t)}
          >
            <Text style={{ color: tab===t ? theme.colors.primary : theme.colors.muted, fontWeight: '700', fontSize: responsiveFontSize(14) }}>
              {t === 'Pendientes' ? `Pendientes (${pendingCount})` : `Confirmadas (${confirmedCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(a: Appointment) => a.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        renderItem={({ item: a }: { item: Appointment }) => (
          <TouchableOpacity
            key={a.id}
            activeOpacity={0.8}
            onPress={(e) => {
              // If user tapped on action buttons, do not navigate
              // Navigation happens only when pressing the rest of the card
              // We rely on buttons stopping propagation via onPress
              navigation.navigate('AppointmentDetail', { id: a.id });
            }}
            style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: moderateScale(16) }]}
          > 
            <Text style={[styles.cardTitle, { color: theme.colors.text, fontSize: responsiveFontSize(14) }]}>{a.title}</Text>
            <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(12) }}>{new Date(a.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            {a.needsApproval ? (
              <View style={[styles.badge, { backgroundColor: theme.colors.warning, borderColor: theme.colors.border }]}>
                <Text style={{ color: '#3b3b3b', fontWeight: '700', fontSize: responsiveFontSize(12) }}>Pendiente por aprobar</Text>
              </View>
            ) : null}
            {a.status === AppointmentStatus.Pending ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={async () => { await confirmAppointment(a.id); toast.show('Cita confirmada', 'success'); }} style={[styles.confirmBtn, { backgroundColor: theme.colors.success, borderRadius: theme.radius, paddingVertical: moderateScale(8), paddingHorizontal: moderateScale(12) }]}> 
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(12) }}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => { await cancelAppointment(a.id); toast.show('Cita cancelada', 'info'); }} style={[styles.confirmBtn, { backgroundColor: theme.colors.danger, borderRadius: theme.radius, paddingVertical: moderateScale(8), paddingHorizontal: moderateScale(12) }]}> 
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(12) }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}><Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(12) }}>No hay citas para mostrar</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', paddingTop: 8, borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  card: { padding: 16, borderWidth: 1, borderRadius: 12, marginBottom: 12 },
  cardTitle: { fontWeight: '700', marginBottom: 4 },
  confirmBtn: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  badge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, marginTop: 6 },
});


