import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
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

  console.log('[AppointmentsScreen] Appointments state:', appointments.length, appointments);

  // Cargar visitas reales (admin) y mapear a Appointment para la UI
  async function loadVisits() {
    if (!API) return;
    try {
      console.log('[AppointmentsScreen] Loading visits from API...');
      const res: any = await VisitsApi(API).listAdmin();
      console.log('[AppointmentsScreen] API response:', res);
      console.log('[AppointmentsScreen] API response keys:', Object.keys(res));
      const list: any[] = (res?.visits || res?.data || (Array.isArray(res) ? res : [])) as any[];
      console.log('[AppointmentsScreen] Parsed list length:', list.length);
      
      // Debug: mostrar todas las posibles claves de la respuesta
      if (res) {
        console.log('[AppointmentsScreen] Response keys:', Object.keys(res));
        if (res.data) {
          console.log('[AppointmentsScreen] Response.data keys:', Object.keys(res.data));
        }
      }
      const mapped: Appointment[] = list.map((v: any) => {
        console.log('[AppointmentsScreen] Mapping visit:', v);
        const statusLower = String(v?.status || 'pendiente').toLowerCase();
        return {
          id: (v?._id || v?.id) as string,
          clientId: (v?.user?._id || v?.user?.id || 'unknown') as any,
          clientName: v?.user?.name || 'Sin nombre',
          clientEmail: v?.user?.email || '',
          title: v?.user?.name ? `Visita: ${v.user.name}` : (v?.title || 'Visita'),
          datetime: v?.visitDate || v?.date || v?.startedAt || new Date().toISOString(),
          status: (statusLower === 'pendiente' ? AppointmentStatus.Pending : 
                   statusLower === 'confirmada' ? AppointmentStatus.Confirmed : 
                   AppointmentStatus.Pending) as any,
          needsApproval: statusLower === 'pendiente',
          notes: v?.notes || '',
          createdAt: v?.createdAt || new Date().toISOString(),
          updatedAt: v?.updatedAt || new Date().toISOString(),
          location: { type: 'Point', coordinates: [0, 0] },
          address: v?.address || 'Sin dirección',
        } as Appointment;
      });
      setAppointments(mapped);
      setError(null);
      console.log('[AppointmentsScreen] Visits loaded successfully:', mapped.length);
    } catch (e) {
      console.error('[AppointmentsScreen] Error loading visits:', e);
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.colors.text, fontSize: responsiveFontSize(14), fontWeight: '700' }]}>
                  {(a as any).clientName || 'Cliente'}
                </Text>
                <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(11), marginTop: 2 }}>
                  {(a as any).clientEmail || ''}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: a.status === AppointmentStatus.Pending ? theme.colors.warning : theme.colors.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }]}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(10) }}>
                  {a.status === AppointmentStatus.Pending ? 'Pendiente' : 'Confirmada'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={{ color: theme.colors.primary, fontSize: responsiveFontSize(13), fontWeight: '700' }}>
                📅 {new Date(a.datetime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(12) }}>
                {new Date(a.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={{ color: theme.colors.text, fontSize: responsiveFontSize(12), marginBottom: 4 }}>
              📍 {a.address}
            </Text>
            {(a as any).notes ? (
              <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(11), fontStyle: 'italic', marginTop: 4 }}>
                Nota: {(a as any).notes}
              </Text>
            ) : null}
            {a.status === AppointmentStatus.Pending ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity
                  disabled={actingId === a.id}
                  onPress={async () => {
                    try { setActingId(a.id); await confirmAppointment(a.id); toast.show('Visita confirmada', 'success'); await loadVisits(); }
                    catch (e) { toast.show((e as Error)?.message || 'No se pudo confirmar', 'error'); }
                    finally { setActingId(null); }
                  }}
                  style={[styles.confirmBtn, { backgroundColor: theme.colors.success, borderRadius: theme.radius, paddingVertical: moderateScale(10), paddingHorizontal: moderateScale(16), opacity: actingId === a.id ? 0.6 : 1, flex: 1 }]}
                > 
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(12), textAlign: 'center' }}>✓ Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={actingId === a.id}
                  onPress={async () => {
                    try { setActingId(a.id); await cancelAppointment(a.id); toast.show('Visita cancelada', 'info'); await loadVisits(); }
                    catch (e) { toast.show((e as Error)?.message || 'No se pudo cancelar', 'error'); }
                    finally { setActingId(null); }
                  }}
                  style={[styles.confirmBtn, { backgroundColor: theme.colors.danger, borderRadius: theme.radius, paddingVertical: moderateScale(10), paddingHorizontal: moderateScale(16), opacity: actingId === a.id ? 0.6 : 1, flex: 1 }]}
                > 
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(12), textAlign: 'center' }}>✕ Cancelar</Text>
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


