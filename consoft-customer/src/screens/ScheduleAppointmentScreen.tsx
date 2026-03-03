import React, { useMemo, useState, useEffect } from 'react';
import { useToast } from '../ui/ToastProvider';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Animated, Easing, Pressable } from 'react-native';
import { useUserStore } from '../store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { API } from '../config';
import { VisitsApi, UsersApi } from '../api/client';
import { useTheme } from '../theme/theme';

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

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function ScheduleAppointmentScreen({ route, navigation }: Props) {
  const toast = useToast();
  const { theme } = useTheme();
  const contact = useUserStore((s) => s.contact);

  // Información de contacto
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loadingUserData, setLoadingUserData] = useState(true);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (!API) return;
        const res = await UsersApi(API).me();
        const user: any = (res as any)?.user || res;
        
        // Autorellenar con datos del usuario
        if (user.name) setName(user.name);
        if (user.email) setEmail(user.email);
        if (user.phone) setPhone(user.phone);
        if (user.address) setAddress(user.address);
      } catch (e) {
        // Si falla, intentar usar datos del store
        if (contact?.backupEmail) setEmail(contact.backupEmail);
        if (contact?.backupPhone) setPhone(contact.backupPhone);
        if (contact?.defaultAddress) setAddress(contact.defaultAddress);
      } finally {
        setLoadingUserData(false);
      }
    };
    loadUserData();
  }, []);

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

  // Cargar slots disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (!selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const res = await VisitsApi(API).getAvailableSlots(dateStr);
        setAvailableSlots((res as any).availableSlots || []);
        setSelectedTime(''); // Reset time cuando cambia fecha
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

  const submit = async () => {
    // Validaciones
    if (!name.trim()) {
      toast.show('Ingresa tu nombre completo', 'error');
      return;
    }
    if (!email.trim()) {
      toast.show('Ingresa tu email', 'error');
      return;
    }
    if (!phone.trim()) {
      toast.show('Ingresa tu teléfono', 'error');
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
      const visitDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const payload: any = {
        visitDate,
        visitTime: selectedTime,
        address: address.trim(),
        description: description.trim() || undefined,
        userName: name.trim(),
        userEmail: email.trim(),
        userPhone: phone.trim(),
      };

      await VisitsApi(API).create(payload);
      toast.show('¡Visita agendada exitosamente!', 'success');
      navigation.goBack();
    } catch (e: any) {
      toast.show(e.message || 'Error al agendar visita', 'error');
    } finally {
      setLoading(false);
    }
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

  if (loadingUserData) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingScreenText, { color: theme.colors.muted }]}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.mainTitle, { color: theme.colors.text }]}>Agenda tu <Text style={[styles.visitText, { color: theme.colors.primary }]}>visita</Text></Text>
      <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Vamos hasta tu casa. Cuéntanos cuándo y dónde, y nuestro equipo estará listo para asesorarte.</Text>

      {/* Información de contacto */}
      <View style={[styles.section, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>INFORMACIÓN DE CONTACTO</Text>
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="person-outline" size={18} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Nombre completo"
                placeholderTextColor={theme.colors.muted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>
          <View style={styles.halfInput}>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Email"
                placeholderTextColor={theme.colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="call-outline" size={18} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Teléfono"
                placeholderTextColor={theme.colors.muted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
          <View style={styles.halfInput}>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="location-outline" size={18} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Dirección"
                placeholderTextColor={theme.colors.muted}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>
        </View>

        <Text style={[styles.optionalLabel, { color: theme.colors.primary }]}>DESCRIPCIÓN (opcional)</Text>
        <View style={[styles.textAreaContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} style={styles.textAreaIcon} />
          <TextInput
            style={[styles.textArea, { color: theme.colors.text }]}
            placeholder="Cuéntanos qué necesitas o qué mueble tienes en mente..."
            placeholderTextColor={theme.colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Fecha de visita */}
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
                        selected && { color: theme.mode === 'dark' ? '#1a1a1a' : '#fff', fontWeight: '700' },
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

        <View style={[styles.legendRow, { borderTopColor: theme.colors.border }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.muted, opacity: 0.5 }]} />
            <Text style={[styles.legendText, { color: theme.colors.muted }]}>Fecha pasada</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.background, borderWidth: 2, borderColor: theme.colors.primary }]} />
            <Text style={[styles.legendText, { color: theme.colors.muted }]}>Hoy</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.legendText, { color: theme.colors.muted }]}>Seleccionado</Text>
          </View>
        </View>
      </View>

      {/* Hora de visita */}
      <View style={[styles.section, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>HORA DE VISITA</Text>
        {!selectedDate ? (
          <View style={[styles.placeholderBox, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.placeholderText, { color: theme.colors.muted }]}>Selecciona una fecha para ver los horarios disponibles.</Text>
          </View>
        ) : loadingSlots ? (
          <View style={[styles.loadingBox, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.muted }]}>Cargando horarios...</Text>
          </View>
        ) : availableSlots.length === 0 ? (
          <View style={[styles.placeholderBox, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.placeholderText, { color: theme.colors.muted }]}>No hay horarios disponibles para esta fecha.</Text>
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
                <Text style={[
                  styles.slotText,
                  { color: theme.colors.text },
                  selectedTime === slot && { color: theme.mode === 'dark' ? '#1a1a1a' : '#fff' },
                ]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Botón de agendar */}
      <View style={styles.footer}>
        <Text style={[styles.footerNote, { color: theme.colors.text }]}>Completa tu solicitud</Text>
        <Text style={[styles.footerSubnote, { color: theme.colors.muted }]}>Todos los campos son requeridos</Text>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.colors.primary }, loading && styles.submitButtonDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={[styles.submitText, { color: theme.mode === 'dark' ? '#1a1a1a' : '#fff' }]}>Agendar Visita</Text>
              <Ionicons name="arrow-forward" size={20} color={theme.mode === 'dark' ? '#1a1a1a' : '#fff'} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingScreenText: {
    fontSize: 14,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  visitText: {
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  optionalLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 12,
  },
  textAreaContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minHeight: 100,
  },
  textAreaIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  textArea: {
    flex: 1,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  calendar: {
    borderRadius: 12,
    padding: 12,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDay: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
  },
  placeholderBox: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingBox: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  slotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
    marginBottom: 20,
  },
  footerNote: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubnote: {
    fontSize: 12,
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
