import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../theme/theme';
import { responsiveFontSize, moderateScale, verticalScale } from '../../../theme/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { API } from '../../../config';
import { UsersApi, VisitsApi } from '../../../api/client';
import { useToast } from '../../../ui/ToastProvider';

function generateMonthMatrix(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const startWeekday = firstDay.getDay();
  const numDays = new Date(year, monthIndex + 1, 0).getDate();
  const weeks: Array<Array<{ d: number | null; date?: Date }>> = [];
  let week: Array<{ d: number | null; date?: Date }> = [];
  for (let i = 0; i < startWeekday; i += 1) week.push({ d: null });
  for (let day = 1; day <= numDays; day += 1) {
    const date = new Date(year, monthIndex, day);
    week.push({ d: day, date });
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push({ d: null });
    weeks.push(week);
  }
  return weeks;
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function AppointmentCreateScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const toast = useToast();
  
  // Cliente
  const [clientQuery, setClientQuery] = useState('');
  const [clientOptions, setClientOptions] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState('');
  const clientDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const hasLoadedAllRef = useRef(false);
  
  // Dirección y descripción
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  
  // Calendario y slots
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [monthIndex, setMonthIndex] = useState<number>(today.getMonth());
  const [year, setYear] = useState<number>(today.getFullYear());
  const [loading, setLoading] = useState(false);

  const weeks = useMemo(() => generateMonthMatrix(year, monthIndex), [monthIndex, year]);
  const monthLabel = useMemo(
    () => new Date(year, monthIndex, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
    [monthIndex, year]
  );

  // Cargar usuarios
  async function loadAllUsersIfNeeded() {
    if (hasLoadedAllRef.current || !API) return;
    try {
      setClientLoading(true);
      setClientError(null);
      const res = await UsersApi(API).search('');
      const r: any = res as any;
      const list: any = r?.users ?? r?.results ?? r?.items ?? r?.data?.users ?? r?.data?.results ?? (Array.isArray(r) ? r : []);
      const mapped = (list as any[]).map((u: any) => ({
        id: u._id || u.id,
        name: u.name || [u.firstName, u.lastName].filter(Boolean).join(' '),
        email: u.email,
      }));
      setAllUsers(mapped);
      hasLoadedAllRef.current = true;
    } catch (e) {
      setClientError((e as Error)?.message || null);
    } finally {
      setClientLoading(false);
    }
  }

  // Buscar clientes
  useEffect(() => {
    if (clientDebounceRef.current) {
      clearTimeout(clientDebounceRef.current);
      clientDebounceRef.current = null;
    }
    const q = clientQuery.trim();
    clientDebounceRef.current = setTimeout(async () => {
      try {
        const lowered = q.toLowerCase();
        await loadAllUsersIfNeeded();
        let filtered = (allUsers || []).filter((u: any) => {
          const nameOk = (u.name || '').toLowerCase().includes(lowered);
          const emailOk = (u.email || '').toLowerCase().includes(lowered);
          return nameOk || emailOk;
        });
        setClientOptions(filtered);
        setShowClientDropdown(true);
      } catch (e) {
        setClientError((e as Error)?.message || null);
        setClientOptions([]);
        setShowClientDropdown(true);
      } finally {
        setClientLoading(false);
      }
    }, 250);
  }, [clientQuery, allUsers]);

  // Cargar slots disponibles
  useEffect(() => {
    if (!selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const res = await VisitsApi(API).getAvailableSlots(dateStr);
        setAvailableSlots((res as any).availableSlots || []);
        setSelectedTime('');
      } catch (e: any) {
        toast.show(e.message || 'Error al cargar horarios', 'error');
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate]);

  const onPrevMonth = () => {
    if (monthIndex === 0) { setMonthIndex(11); setYear((y) => y - 1); }
    else setMonthIndex((m) => m - 1);
  };
  
  const onNextMonth = () => {
    if (monthIndex === 11) { setMonthIndex(0); setYear((y) => y + 1); }
    else setMonthIndex((m) => m + 1);
  };

  const isToday = (date: Date) => {
    const now = new Date();
    return date.toDateString() === now.toDateString();
  };

  const isPast = (date: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < now;
  };

  const submit = async () => {
    if (!selectedClientId) {
      toast.show('Selecciona un cliente', 'error');
      return;
    }
    if (!address.trim()) {
      toast.show('Ingresa la dirección', 'error');
      return;
    }
    if (!selectedDate) {
      toast.show('Selecciona una fecha', 'error');
      return;
    }
    if (!selectedTime) {
      toast.show('Selecciona una hora', 'error');
      return;
    }

    setLoading(true);
    try {
      const visitDate = selectedDate.toISOString().split('T')[0];
      await VisitsApi(API).createForUser({
        user: selectedClientId,
        visitDate,
        visitTime: selectedTime,
        address: address.trim(),
        description: description.trim() || undefined,
        status: 'pendiente',
      });
      toast.show('¡Visita creada exitosamente!', 'success');
      navigation.goBack();
    } catch (e: any) {
      toast.show(e.message || 'Error al crear visita', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.mainTitle, { color: theme.colors.text }]}>Crear Visita para Cliente</Text>
      <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Agenda una visita para un cliente existente</Text>

      {/* Búsqueda de cliente */}
      <View style={[styles.section, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>CLIENTE</Text>
        <View>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <Ionicons name="person-outline" size={18} color={theme.colors.muted} style={styles.inputIcon} />
            <TextInput
              value={clientQuery}
              onChangeText={(t) => { setClientQuery(t); setShowClientDropdown(true); }}
              placeholder="Buscar cliente por nombre o email"
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, { color: theme.colors.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => { setShowClientDropdown(true); loadAllUsersIfNeeded(); }}
            />
          </View>
          {showClientDropdown && (
            <View style={[styles.dropdown, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
              {clientLoading ? (
                <View style={styles.dropdownItem}><Text style={{ color: theme.colors.muted }}>Buscando...</Text></View>
              ) : clientError ? (
                <View style={styles.dropdownItem}><Text style={{ color: theme.colors.muted }}>Error: {clientError}</Text></View>
              ) : clientOptions.length > 0 ? (
                <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
                  {clientOptions.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      onPress={() => {
                        setSelectedClientId(u.id);
                        setSelectedClientName(u.name);
                        setClientQuery(u.name);
                        setShowClientDropdown(false);
                      }}
                      style={[styles.dropdownItem, { borderBottomColor: theme.colors.border }]}
                    >
                      <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{u.name}</Text>
                      <Text style={{ color: theme.colors.muted, fontSize: responsiveFontSize(11) }}>{u.email}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.dropdownItem}>
                  <Text style={{ color: theme.colors.muted }}>
                    {clientQuery.trim().length ? 'Sin resultados' : 'Escribe para buscar'}
                  </Text>
                </View>
              )}
            </View>
          )}
          {selectedClientId && (
            <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontWeight: '600', marginLeft: 6 }}>
                Cliente seleccionado: {selectedClientName}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.label, { color: theme.colors.muted }]}>Dirección</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <Ionicons name="location-outline" size={18} color={theme.colors.muted} style={styles.inputIcon} />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Dirección de la visita"
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, { color: theme.colors.text }]}
          />
        </View>

        <Text style={[styles.label, { color: theme.colors.muted }]}>Descripción (opcional)</Text>
        <View style={[styles.textAreaContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <Ionicons name="document-text-outline" size={18} color={theme.colors.muted} style={styles.textAreaIcon} />
          <TextInput
            style={[styles.textArea, { color: theme.colors.text }]}
            placeholder="Notas adicionales sobre la visita..."
            placeholderTextColor={theme.colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Calendario */}
      <View style={[styles.section, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>FECHA DE VISITA</Text>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={onPrevMonth} style={[styles.navButton, { backgroundColor: theme.colors.background }]}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: theme.colors.text }]}>{monthLabel}</Text>
          <TouchableOpacity onPress={onNextMonth} style={[styles.navButton, { backgroundColor: theme.colors.background }]}>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.calendar, { backgroundColor: theme.colors.background }]}>
          <View style={styles.weekHeader}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={[styles.weekDay, { color: theme.colors.muted }]}>{d}</Text>
            ))}
          </View>

          {weeks.map((w, wi) => (
            <View key={wi} style={styles.weekRow}>
              {w.map((cell, ci) => {
                const selected = cell.date && selectedDate && cell.date.toDateString() === selectedDate.toDateString();
                const past = cell.date && isPast(cell.date);
                const today = cell.date && isToday(cell.date);
                return (
                  <TouchableOpacity
                    key={`${wi}-${ci}`}
                    style={[
                      styles.dayCell,
                      selected && { backgroundColor: theme.colors.primary },
                      today && !selected && { borderWidth: 2, borderColor: theme.colors.primary },
                    ]}
                    disabled={!cell.d || past}
                    onPress={() => {
                      if (!cell.date || past) return;
                      setSelectedDate(cell.date);
                    }}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: theme.colors.text },
                        !cell.d && { opacity: 0 },
                        selected && { color: '#fff', fontWeight: '700' },
                        past && { color: theme.colors.muted, opacity: 0.5 },
                      ]}
                    >
                      {cell.d ?? ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Slots disponibles */}
      <View style={[styles.section, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>HORA DE VISITA</Text>
        {!selectedDate ? (
          <View style={[styles.placeholderBox, { backgroundColor: theme.colors.background }]}>
            <Text style={{ color: theme.colors.muted, textAlign: 'center' }}>
              Selecciona una fecha para ver los horarios disponibles
            </Text>
          </View>
        ) : loadingSlots ? (
          <View style={[styles.loadingBox, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={{ color: theme.colors.muted }}>Cargando horarios...</Text>
          </View>
        ) : availableSlots.length === 0 ? (
          <View style={[styles.placeholderBox, { backgroundColor: theme.colors.background }]}>
            <Text style={{ color: theme.colors.muted, textAlign: 'center' }}>
              No hay horarios disponibles para esta fecha
            </Text>
          </View>
        ) : (
          <View style={styles.slotsGrid}>
            {availableSlots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.slotButton,
                  { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                  selectedTime === slot && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setSelectedTime(slot)}
              >
                <Text
                  style={[
                    styles.slotText,
                    { color: theme.colors.text },
                    selectedTime === slot && { color: '#fff', fontWeight: '700' },
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Botones */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnGhost, { borderColor: theme.colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnFilled, { backgroundColor: theme.colors.primary }, loading && { opacity: 0.6 }]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Crear Visita</Text>
              <Ionicons name="checkmark" size={20} color="#fff" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainTitle: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 8, paddingHorizontal: 16 },
  subtitle: { fontSize: 14, marginBottom: 16, paddingHorizontal: 16 },
  section: { borderWidth: 1, borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  label: { fontSize: 12, marginTop: 12, marginBottom: 6 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 48 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14 },
  dropdown: { borderWidth: 1, borderRadius: 10, marginTop: 8, zIndex: 20, elevation: 20, overflow: 'hidden' },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  textAreaContainer: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 12, minHeight: 80 },
  textAreaIcon: { marginRight: 8, marginTop: 2 },
  textArea: { flex: 1, fontSize: 14, textAlignVertical: 'top' },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navButton: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  monthText: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  calendar: { borderRadius: 10, padding: 12 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekDay: { width: 40, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  dayCell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 14 },
  placeholderBox: { borderRadius: 10, padding: 20, alignItems: 'center' },
  loadingBox: { borderRadius: 10, padding: 20, alignItems: 'center', gap: 12 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, minWidth: 80, alignItems: 'center' },
  slotText: { fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 8, marginBottom: 20 },
  btnGhost: { flex: 1, borderWidth: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 14, flexDirection: 'row', justifyContent: 'center' },
  btnFilled: { flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 14, flexDirection: 'row', justifyContent: 'center' },
});
