import { PersonProfile } from "../entities/PersonProfile";
import { IRepository } from "./IRepository";

export interface IPersonProfileRepository extends IRepository<PersonProfile> {
  findByUserId(userId: string): Promise<PersonProfile | null>;
}
