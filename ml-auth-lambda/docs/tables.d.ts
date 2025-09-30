interface Users {
  id: string; // (UUID)
  email: string;
  status: string; // "confirmed" | "unconfirmed" | "suspended"
  userTypeId: string; // Foreign Key a UserTypes
  countryId: string; // Foreign Key a Countries/Locations
  createdAt: string; // ISO 8601 "2024-09-03T15:30:00.000Z"
  updatedAt: string; // ISO 8601 "2024-09-03T15:30:00.000Z"
}

interface UserTypes {
  id: string; // PROPERTY_OWNER | PROSPECT ...
  description?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

interface PersonProfile {
  id: string; // (UUID)
  userId: string; // Foreign Key a Users
  firstName: string;
  lastName: string;
  birthDate: string;
  hasOrgMembership: boolean; // false por defecto
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

interface OrgProfile {
  id: string; // (UUID)
  userId: string; // Foreign Key a Users
  orgName: string;
  description?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

interface DocumentTypes {
  id: string; // 'CC'|'CE'|'NIT'
  countryId: string; // Foreign Key - país donde aplica este tipo
  attributes: object; // Atributos específicos del tipo (JSON) ej: {dv:string}
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

interface Documents {
  id: string; // UUID
  userId: string; //FK a Users
  documentTypeId: string; // Foreign Key a DocumentTypes
  details: object; // Detalles específicos del documento (JSON) debe corresponder a los attributes del tipo de documento ej: {dv: 4}
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

interface Roles {
  id: string; // (UUID)
  code: string; // Código único del rol: 'owner' | 'real-estate' | 'real-estate-agent' | 'independent agent' | 'construction-company' | 'prospect' | 'super-admin'
  description?: string;
  scope: string; // "global" | "app" | "backoffice"
  permissions: string[]; // Array de permisos - se relaciona con la tabla de permissions
  status: string; // "active" | "inactive"
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

interface Permissions {
  id: string; // (UUID)
  code: string;
  description?: string;
  scope: string; // "global" | "app" | "backoffice"
  status: string; // "active" | "inactive"
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

interface AgencyJoinCodes {
  id: string; // (UUID)
  orgProfileId: string; // FK de OrgProfile
  joinCode: string; // 6 caracteres alfanuméricos
  title?: string; // "pending" | "active" | "rejected" | "removed"
  type: string; // "one-time" | "multi-use" por defecto "multi-use"
  maxUses?: number; // por defecto 3
  expiresAt?: string;
  createdBy: string; // userId
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

interface Sessions {
  id: string; // (UUID)
  userId: string; // Foreign Key a Users
  lastSession: string; // ISO 8601 "2024-09-03T15:30:00.000Z"
  appVersion: string;
  platform: string;
  ip: string;
  geo: object; // {longitude: string; latitude: string;}
  createdAt: string; // ISO 8601 "2024-09-03T15:30:00.000Z"
  updatedAt: string; // ISO 8601 "2024-09-03T15:30:00.000Z"
}

interface UserRoles {
  id: string; // (UUID)
  userId: string; // Foreign Key a Users
  roleId: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
