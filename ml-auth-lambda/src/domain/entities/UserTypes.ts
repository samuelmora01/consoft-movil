export class UserTypes {
  id: string;
  description?: string;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    description?: string,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.description = description;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}
