export class DocumentTypes {
  id: string;
  attributes: string[];
  countryId: string;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    attributes: string[],
    countryId: string,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id;
    this.attributes = attributes;
    this.countryId = countryId;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}
