export class UserRoles {
  id: string;
  userId: string;
  roleId: string;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    userId: string,
    roleId: string,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.userId = userId;
    this.roleId = roleId;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}
