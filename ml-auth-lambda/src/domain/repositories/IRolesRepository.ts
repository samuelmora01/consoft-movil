import { Roles } from "../entities/Roles";
import { IRepository } from "./IRepository";

export interface IRolesRepository extends IRepository<Roles> {
  findByCode(code: string): Promise<Roles | null>;
}
