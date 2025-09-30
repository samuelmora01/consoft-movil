import { Sessions } from "../entities/Sessions";
import { IRepository } from "./IRepository";

export interface ISessionsRepository extends IRepository<Sessions> {
  // You can add specific methods for Sessions repository here
  // For example: findByName(name: string): Promise<Sessions | null>;
}
