import { Appointment, AppointmentStatus, UUID } from '../../domain/types';
import { useAppStore } from '../../store/appStore';
import { API } from '../../config';
import { VisitsApi } from '../../api/client';

// Thin async wrappers to prepare for future API/Mongo integration

export async function listAppointments(): Promise<Appointment[]> {
  const state = useAppStore.getState();
  return state.appointments;
}

export async function getAppointment(id: UUID): Promise<Appointment | undefined> {
  const state = useAppStore.getState();
  return state.appointments.find((a) => a.id === id);
}

export async function confirmAppointment(id: UUID): Promise<void> {
  const { setAppointmentStatus } = useAppStore.getState();
  if (!API) throw new Error('Configura API');
  // Intenta actualizar estado en backend; si falla, lanza error y no cambia local
  await VisitsApi(API).updateStatus(String(id), 'confirmada');
  setAppointmentStatus(id, AppointmentStatus.Confirmed);
}

export async function cancelAppointment(id: UUID): Promise<void> {
  const { setAppointmentStatus } = useAppStore.getState();
  if (!API) throw new Error('Configura API');
  await VisitsApi(API).updateStatus(String(id), 'cancelada');
  setAppointmentStatus(id, AppointmentStatus.Cancelled);
}

export async function rescheduleAppointment(id: UUID, newISODate: string): Promise<void> {
  const { rescheduleAppointment } = useAppStore.getState();
  if (!API) throw new Error('Configura API');
  // Enviar fecha/hora en ISO local sin Z para evitar desfase por UTC
  const getLocalIsoNoZ = (iso: string) => {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().replace('Z', '');
  };
  await VisitsApi(API).update(String(id), { visitDate: getLocalIsoNoZ(newISODate) });
  rescheduleAppointment(id, newISODate);
}

