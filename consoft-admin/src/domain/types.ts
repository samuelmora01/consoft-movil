export type UUID = string;

export enum Role {
  Admin = 'ADMIN',
  Employee = 'EMPLOYEE',
}

export enum ServiceType {
  Fabricacion = 'FABRICACION',
  Reparacion = 'REPARACION',
  Tapizado = 'TAPIZADO',
  Decoracion = 'DECORACION',
}

export interface User {
  id: UUID;
  name: string;
  email: string;
  role: Role;
}

export interface Client {
  id: UUID;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export enum AppointmentStatus {
  Pending = 'PENDING',
  Confirmed = 'CONFIRMED',
  Cancelled = 'CANCELLED',
}

export interface Appointment {
  id: UUID;
  clientId: UUID;
  title: string;
  datetime: string; // ISO
  status: AppointmentStatus;
  // Optional address for on-site visits
  address?: string;
  // When a date/time change is proposed and must be approved
  needsApproval?: boolean;
  // ISO timestamps for persistence and sync
  createdAt: string;
  updatedAt: string;
  // Optional location in GeoJSON Point format for MongoDB compatibility
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface QuotationItem {
  id: UUID;
  name: string;
  observations?: string;
  price: number;
  serviceType?: ServiceType;
}

export enum DocumentStatus {
  Draft = 'DRAFT',
  Quotation = 'QUOTATION',
  Order = 'ORDER',
  Completed = 'COMPLETED',
}

export enum OrderState {
  Pending = 'PENDING',
  Confirmed = 'CONFIRMED',
  Cancelled = 'CANCELLED',
}

export interface SalesDocument {
  id: UUID;
  clientId: UUID;
  clientName?: string;
  clientEmail?: string;
  orderName?: string;
  items: QuotationItem[];
  status: DocumentStatus; // Evolves: quotation -> order -> completed
  createdAt: string; // ISO
  updatedAt: string; // ISO
  orderState?: OrderState;
  images?: string[];
  featuredImage?: string;
  deliveryDate?: string; // ISO - fecha de entrega asignada
}

export interface Paginated<T> {
  data: T[];
  total: number;
}


export interface Review {
  id: UUID;
  clientName: string;
  rating: number; // 1-5
  comment: string;
  avatarUrl?: string;
  createdAt: string; // ISO
}



