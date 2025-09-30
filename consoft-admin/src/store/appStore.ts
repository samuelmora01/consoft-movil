import { create } from 'zustand';
import {
  Appointment,
  AppointmentStatus,
  UUID,
  SalesDocument,
  DocumentStatus,
  QuotationItem,
} from '../domain/types';

export interface AppState {
  // Auth
  isSignedIn: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
  profile: { name: string; email: string; phone?: string; address?: string; avatarUrl?: string } | null;
  updateProfile: (payload: Partial<{ name: string; email: string; phone?: string; address?: string; avatarUrl?: string }>) => void;
  suspendAccount: () => void;
  closeAccount: () => void;
  appointments: Appointment[];
  setAppointmentStatus: (id: UUID, status: AppointmentStatus) => void;
  rescheduleAppointment: (id: UUID, newISODate: string) => void;
  updateAppointmentLocation: (id: UUID, longitude: number, latitude: number) => void;
  createAppointment: (payload: { title: string; clientId: UUID; datetimeISO: string }) => Appointment;
  documents: SalesDocument[];
  createDocument: (clientId: UUID) => SalesDocument;
  removeDocument: (documentId: UUID) => void;
  addItemToDocument: (documentId: UUID, item: Pick<QuotationItem, 'name' | 'price' | 'observations' | 'serviceType'>) => void;
  finalizeQuotation: (documentId: UUID) => void;
  updateOrderState: (documentId: UUID, state: import('../domain/types').OrderState) => void;
  addOrderImage: (documentId: UUID, imageUrl: string) => void;
  setDeliveryDate: (documentId: UUID, iso: string) => void;
  seedAppointments: (count?: number) => void;
  // Reviews
  reviews: import('../domain/types').Review[];
  addReview: (payload: { clientName: string; rating: number; comment: string; avatarUrl?: string }) => void;
  seedReviews: () => void;
  removeReview: (id: UUID) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSignedIn: false,
  signIn: () => set({ isSignedIn: true }),
  signOut: () => set({ isSignedIn: false }),
  profile: { name: 'Samuel Mora', email: 'correo@correo.com', phone: '', address: '', avatarUrl: 'https://i.pravatar.cc/120?img=5' },
  updateProfile: (payload) => set((state) => ({ profile: { ...state.profile!, ...payload } })),
  suspendAccount: () => set((state) => ({ isSignedIn: false, profile: state.profile ? { ...state.profile, status: 'SUSPENDED' as any } : null })),
  closeAccount: () => set(() => ({ isSignedIn: false, profile: null })),
  appointments: [],
  setAppointmentStatus: (id, status) =>
    set((state) => ({
      appointments: state.appointments.map((appointment) =>
        appointment.id === id ? { ...appointment, status } : appointment,
      ),
    })),
  rescheduleAppointment: (id, newISODate) =>
    set((state) => ({
      appointments: state.appointments.map((appointment) =>
        appointment.id === id
          ? { ...appointment, datetime: newISODate, status: AppointmentStatus.Pending, needsApproval: true, updatedAt: new Date().toISOString() }
          : appointment,
      ),
    })),
  createAppointment: ({ title, clientId, datetimeISO }) => {
    const now = new Date().toISOString();
    const appt: Appointment = {
      id: generateId(),
      clientId,
      title,
      datetime: datetimeISO,
      status: AppointmentStatus.Pending,
      needsApproval: false,
      createdAt: now,
      updatedAt: now,
      location: { type: 'Point', coordinates: [-1.8904, 52.4862] },
    };
    set((state) => ({ appointments: [appt, ...state.appointments] }));
    return appt;
  },
  updateAppointmentLocation: (id, longitude, latitude) =>
    set((state) => ({
      appointments: state.appointments.map((appointment) =>
        appointment.id === id
          ? {
              ...appointment,
              location: { type: 'Point', coordinates: [longitude, latitude] },
              updatedAt: new Date().toISOString(),
            }
          : appointment,
      ),
    })),
  documents: [],
  createDocument: (clientId) => {
    const now = new Date().toISOString();
    const newDoc: SalesDocument = {
      id: generateId(),
      clientId,
      clientName: '',
      clientEmail: '',
      orderName: `Pedido #${Math.floor(Math.random() * 9000 + 1000)}`,
      items: [],
      status: DocumentStatus.Quotation,
      orderState: 'PENDING' as any,
      images: [],
      deliveryDate: undefined,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ documents: [newDoc, ...state.documents] }));
    return newDoc;
  },
  removeDocument: (documentId) =>
    set((state) => ({ documents: state.documents.filter((d) => d.id !== documentId) })),
  addItemToDocument: (documentId, item) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              items: [
                ...doc.items,
                { id: generateId(), name: item.name, observations: item.observations, price: item.price, serviceType: item.serviceType },
              ],
              updatedAt: new Date().toISOString(),
            }
          : doc,
      ),
    })),
  finalizeQuotation: (documentId) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? { ...doc, status: DocumentStatus.Completed, updatedAt: new Date().toISOString() }
          : doc,
      ),
    })),
  updateOrderState: (documentId, state) =>
    set((state0) => ({
      documents: state0.documents.map((doc) =>
        doc.id === documentId
          ? { ...doc, orderState: state, updatedAt: new Date().toISOString() }
          : doc,
      ),
    })),
  addOrderImage: (documentId, imageUrl) =>
    set((state0) => ({
      documents: state0.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              images: [...(doc.images ?? []), imageUrl],
              featuredImage: doc.featuredImage ?? imageUrl,
              updatedAt: new Date().toISOString(),
            }
          : doc,
      ),
    })),
  setDeliveryDate: (documentId, iso) =>
    set((state0) => ({
      documents: state0.documents.map((doc) =>
        doc.id === documentId
          ? { ...doc, deliveryDate: iso, updatedAt: new Date().toISOString() }
          : doc,
      ),
    })),
  seedAppointments: (count = 6) =>
    set(() => {
      const now = Date.now();
      const appts: Appointment[] = Array.from({ length: count }).map((_, i) => ({
        id: generateId(),
        clientId: generateId(),
        title: `Visita técnica ${i + 1}`,
        datetime: new Date(now + i * 60 * 60 * 1000).toISOString(),
        status: i % 2 === 0 ? AppointmentStatus.Pending : AppointmentStatus.Confirmed,
        needsApproval: false,
        createdAt: new Date(now - i * 60 * 1000).toISOString(),
        updatedAt: new Date(now - i * 60 * 1000).toISOString(),
        location: { type: 'Point', coordinates: [-74.0817 + i * 0.001, 4.6097 + i * 0.001] },
      }));
      return { appointments: appts };
    }),
  // Reviews state
  reviews: [],
  addReview: ({ clientName, rating, comment, avatarUrl }) =>
    set((state) => ({
      reviews: [
        {
          id: generateId(),
          clientName,
          rating,
          comment,
          avatarUrl,
          createdAt: new Date().toISOString(),
        },
        ...state.reviews,
      ],
    })),
  seedDocuments: () =>
    set(() => {
      const now = Date.now();
      const docs: SalesDocument[] = [
        {
          id: generateId(),
          clientId: generateId(),
          items: [
            { id: generateId(), name: 'Tapicería sofá 3 puestos', price: 2400000, observations: 'Tela lino premium', serviceType: undefined },
            { id: generateId(), name: 'Limpieza profunda', price: 1000000, observations: 'Incluye protección', serviceType: undefined },
          ],
          status: DocumentStatus.Order as any,
          orderState: 'CONFIRMED' as any,
          images: ['https://images.unsplash.com/photo-1540575161460-9c8b1a56e8f4?q=80&w=800&auto=format&fit=crop'],
          featuredImage: 'https://images.unsplash.com/photo-1540575161460-9c8b1a56e8f4?q=80&w=800&auto=format&fit=crop',
          createdAt: new Date(now - 86400000).toISOString(),
          updatedAt: new Date(now - 3600000).toISOString(),
        },
        {
          id: generateId(),
          clientId: generateId(),
          items: [
            { id: generateId(), name: 'Reparación reclinable', price: 1200000, observations: 'Cambio de mecanismo', serviceType: undefined },
            { id: generateId(), name: 'Tapicería reposabrazos', price: 600000, observations: '', serviceType: undefined },
          ],
          status: DocumentStatus.Order as any,
          orderState: 'PENDING' as any,
          images: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop'],
          featuredImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop',
          createdAt: new Date(now - 172800000).toISOString(),
          updatedAt: new Date(now - 7200000).toISOString(),
        },
        {
          id: generateId(),
          clientId: generateId(),
          items: [
            { id: generateId(), name: 'Fabricación personalizada silla', price: 3400000, observations: 'Madera roble', serviceType: undefined },
          ],
          status: DocumentStatus.Order as any,
          orderState: 'CANCELLED' as any,
          images: ['https://images.unsplash.com/photo-1493666438817-866a91353ca9?q=80&w=800&auto=format&fit=crop'],
          featuredImage: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?q=80&w=800&auto=format&fit=crop',
          createdAt: new Date(now - 259200000).toISOString(),
          updatedAt: new Date(now - 10800000).toISOString(),
        },
      ];
      return { documents: docs };
    }),
  seedReviews: () =>
    set(() => ({
      reviews: [
        { id: generateId(), clientName: 'Laura G. Medellín', rating: 5, comment: 'Llegaron puntuales y el trabajo quedó excelente.', avatarUrl: undefined, createdAt: new Date().toISOString() },
        { id: generateId(), clientName: 'Carlos R. Bogotá', rating: 5, comment: 'Restauración impecable, precio justo. Recomendados.', avatarUrl: undefined, createdAt: new Date().toISOString() },
        { id: generateId(), clientName: 'Ana M. Cali', rating: 4, comment: 'Fabricación personalizada superó expectativas.', avatarUrl: undefined, createdAt: new Date().toISOString() },
      ],
    })),
  removeReview: (id) =>
    set((state) => ({ reviews: state.reviews.filter((r) => r.id !== id) })),
}));

function generateId(): UUID {
  // Simple RFC4122-ish ID, sufficient for local state
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }) as UUID;
}


