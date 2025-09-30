import { IAgencyJoinCodesRepository } from '../../../domain/repositories/IAgencyJoinCodesRepository';
import { AgencyJoinCodes } from '../../../domain/entities/AgencyJoinCodes';
import { AgencyJoinCodes_Model } from '../../../domain/models/db/dynamo/AgencyJoinCodesModel';
import { DynamoRepository } from './base/DynamoRepository';

export class DynamoAgencyJoinCodesRepository extends DynamoRepository<AgencyJoinCodes> implements IAgencyJoinCodesRepository {
  
  constructor() {
    super(AgencyJoinCodes_Model);
  }

  protected mapToEntity(item: any): AgencyJoinCodes {
    return new AgencyJoinCodes(
      item.id,
      item.orgProfileId,
      item.joinCode,
      item.type,
      item.createdBy,
      {
        title: item.title,
        maxUses: item.maxUses,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    );
  }

  async findByOrgProfileId(orgProfileId: string): Promise<AgencyJoinCodes[]> {
    const result = await this.model.query().using('OrgProfileIndex').where('orgProfileId').eq(orgProfileId).exec();
    return result.map((item: any) => this.mapToEntity(item));
  }

  async findByJoinCode(joinCode: string): Promise<AgencyJoinCodes | null> {
    const result = await this.model.query().using('JoinCodeIndex').where('joinCode').eq(joinCode).exec();
    return result.count > 0 ? this.mapToEntity(result[0]) : null;
  }
}
