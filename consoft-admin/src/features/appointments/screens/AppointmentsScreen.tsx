import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../theme/theme';
import { useAppStore, AppState } from '../../../store/appStore';
import { Appointment, AppointmentStatus } from '../../../domain/types';
import { confirmAppointment, cancelAppointment } from '../appointmentsService';
import { useToast } from '../../../ui/ToastProvider';
import { responsiveFontSize, moderateScale } from '../../../theme/responsive';
import { API } from '../../../config';
import { VisitsApi } from '../../../api/client';

export default function AppointmentsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const toast = useToast();
  const [tab, setTab] = useState<'Pendientes' | 'Confirmadas'>('Pendientes');
  const appointmentsStore = useAppStore((s: AppState) => s.appointments);
  const setStatus = useAppStore((s: AppState) => s.setAppointmentStatus);
  const [appointments, setAppointments] = useState<Appointment[]>(appointmentsStore);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  // Cargar visitas reales (admin) y mapear a Appointment para la UI
  async function loadVisits() {
    if (!API) return;
    try {
      const res: any = await VisitsApi(API).listAdmin();
      const list: any[] = (res?.visits || res?.items || res?.data?.visits || res?.data || (Array.isArray(res) ? res : [])) as any[];
      const mapped: Appointment[] = list.map((v: any) => ({
        id: (v?._id || v?.id) as string,
        clientId: (v?.user?._id || v?.user?.id || 'unknown') as any,
        title: v?.user?.name ? `Visita: ${v.user.name}` : (v?.title || 'Visita'),
        datetime: v?.visitDate || v?.date || v?.startedAt || new Date().toISOString(),
        status: (String(v?.status).toLowerCase() === 'pendiente' ? AppointmentStatus.Pending : AppointmentStatus.Confirmed) as any,
        needsApproval: false,
        createdAt: v?.createdAt || new Date().toISOString(),
        updatedAt: v?.updatedAt || new Date().toISOString(),
        location: { type: 'Point', coordinates: [0, 0] },
        address: v?.address,
      }));
      setAppointments(mapped);
      setError(null);
    } catch (e) {
      // si falla, dejamos las de store y mostramos error
      setAppointments(appointmentsStore);
      setError((e as Error)?.message || 'No se pudieron cargar las visitas');
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadVisits();
      return () => {};
    }, [])
  );
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
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVisits().finally(() => setRefreshing(false));
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
                <TouchableOpacity
                  disabled={actingId === a.id}
                  onPress={async () => {
                    try { setActingId(a.id); await confirmAppointment(a.id); toast.show('Cita confirmada', 'success'); await loadVisits(); }
                    catch (e) { toast.show((e as Error)?.message || 'No se pudo confirmar', 'error'); }
                    finally { setActingId(null); }
                  }}
                  style={[styles.confirmBtn, { backgroundColor: theme.colors.success, borderRadius: theme.radius, paddingVertical: moderateScale(8), paddingHorizontal: moderateScale(12), opacity: actingId === a.id ? 0.6 : 1 }]}
                > 
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(12) }}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={actingId === a.id}
                  onPress={async () => {
                    try { setActingId(a.id); await cancelAppointment(a.id); toast.show('Cita cancelada', 'info'); await loadVisits(); }
                    catch (e) { toast.show((e as Error)?.message || 'No se pudo cancelar', 'error'); }
                    finally { setActingId(null); }
                  }}
                  style={[styles.confirmBtn, { backgroundColor: theme.colors.danger, borderRadius: theme.radius, paddingVertical: moderateScale(8), paddingHorizontal: moderateScale(12), opacity: actingId === a.id ? 0.6 : 1 }]}
                > 
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(12) }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            {error ? (
              <Text style={{ color: theme.colors.danger, fontSize: responsiveFontSize(12) }}>Error: {error}</Text>
            ) : (
              <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(12) }}>No hay citas para mostrar</Text>
            )}
          </View>
        }
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


