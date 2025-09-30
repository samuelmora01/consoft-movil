export class AgencyJoinCodes {
  id: string; // (UUID)
  orgProfileId: string; // FK de OrgProfile
  joinCode: string; // Código de 6 caracteres (A-Z, 0-9)
  title?: string; // Título descriptivo
  type: string; // "one-time" | "multi-use" por defecto "multi-use"
  maxUses?: number; // por defecto 3
  expiresAt?: string; // ISO string o null
  createdBy: string; // userId
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  constructor(
    id: string,
    orgProfileId: string,
    joinCode: string,
    type: string = 'multi-use',
    createdBy: string,
    options?: {
      title?: string;
      maxUses?: number;
      expiresAt?: string;
      createdAt?: string;
      updatedAt?: string;
    }
  ) {
    this.id = id;
    this.orgProfileId = orgProfileId;
    this.joinCode = joinCode;
    this.type = type;
    this.createdBy = createdBy;
    this.title = options?.title;
    this.maxUses = options?.maxUses || 3;
    this.expiresAt = options?.expiresAt;
    this.createdAt = options?.createdAt || new Date().toISOString();
    this.updatedAt = options?.updatedAt || new Date().toISOString();
  }
}
