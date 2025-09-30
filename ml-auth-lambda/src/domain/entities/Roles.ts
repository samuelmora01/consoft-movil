export class Roles {
  id: string;
  code: string;
  description?: string;
  scope: string;
  permissions: string[];
  status: string;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    code: string,
    scope: string,
    permissions: string[],
    status: string,
    createdAt?: string,
    updatedAt?: string,
    description?: string
  ) {
    this.id = id;
    this.code = code;
    this.scope = scope;
    this.permissions = permissions;
    this.status = status;
    this.description = description;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}
