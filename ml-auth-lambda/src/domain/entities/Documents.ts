export class Documents {
  id: string;
  userId: string;
  documentTypeId: string;
  details: Record<string, any>;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    userId: string,
    documentTypeId: string,
    details: Record<string, any>,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.userId = userId;
    this.documentTypeId = documentTypeId;
    this.details = details;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}
