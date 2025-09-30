export class OrgProfile {
  id: string;
  userId: string;
  orgName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    userId: string,
    orgName: string,
    description?: string,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.userId = userId;
    this.orgName = orgName;
    this.description = description;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}
