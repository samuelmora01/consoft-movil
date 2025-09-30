import { OrgProfile } from "../entities/OrgProfile";
import { IRepository } from "./IRepository";

export interface IOrgProfileRepository extends IRepository<OrgProfile> {
  findByUserId(userId: string): Promise<OrgProfile | null>;
}
