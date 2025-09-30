export class PersonProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  hasOrgMembership: boolean;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    userId: string,
    firstName: string,
    lastName: string,
    hasOrgMembership: boolean = false,
    birthDate?: string,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.userId = userId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthDate = birthDate;
    this.hasOrgMembership = hasOrgMembership;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}
