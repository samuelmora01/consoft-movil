import { AgencyJoinCodes } from "../entities/AgencyJoinCodes";
import { IRepository } from "./IRepository";

export interface IAgencyJoinCodesRepository extends IRepository<AgencyJoinCodes> {
  findByOrgProfileId(orgProfileId: string): Promise<AgencyJoinCodes[]>;
  findByJoinCode(joinCode: string): Promise<AgencyJoinCodes | null>;
}
