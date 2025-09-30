import { Appointment, AppointmentStatus, UUID } from '../../domain/types';
import { useAppStore } from '../../store/appStore';

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
  setAppointmentStatus(id, AppointmentStatus.Confirmed);
}

export async function cancelAppointment(id: UUID): Promise<void> {
  const { setAppointmentStatus } = useAppStore.getState();
  setAppointmentStatus(id, AppointmentStatus.Cancelled);
}

export async function rescheduleAppointment(id: UUID, newISODate: string): Promise<void> {
  const { rescheduleAppointment } = useAppStore.getState();
  rescheduleAppointment(id, newISODate);
}

export async function seedAppointments(count?: number): Promise<void> {
  const { seedAppointments } = useAppStore.getState();
  seedAppointments(count);
}


