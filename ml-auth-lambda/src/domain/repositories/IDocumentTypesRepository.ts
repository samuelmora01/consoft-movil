import { DocumentTypes } from "../entities/DocumentTypes";
import { IRepository } from "./IRepository";

export interface IDocumentTypesRepository extends IRepository<DocumentTypes> {
  // You can add specific methods for DocumentTypes repository here
  // For example: findByName(name: string): Promise<DocumentTypes | null>;
}
