import { Documents } from "../entities/Documents";
import { IRepository } from "./IRepository";

export interface IDocumentsRepository extends IRepository<Documents> {
  findByDocumentNumber(documentTypeId: string, documentNumber: string): Promise<Documents | null>;
  findByUserId(userId: string): Promise<Documents[]>;
}
