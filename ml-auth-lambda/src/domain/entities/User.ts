export class User {
  id: string;
  email: string;
  status: 'unconfirmed' | 'confirmed' | 'suspended';
  userTypeId: string;
  countryId: string;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    email: string,
    status: 'unconfirmed' | 'confirmed' | 'suspended',
    userTypeId: string,
    countryId: string = '170', // Colombia por defecto
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.email = email;
    this.status = status;
    this.userTypeId = userTypeId;
    this.countryId = countryId;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}
