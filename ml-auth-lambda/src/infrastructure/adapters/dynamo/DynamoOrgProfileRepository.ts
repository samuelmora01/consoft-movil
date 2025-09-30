import { IOrgProfileRepository } from '../../../domain/repositories/IOrgProfileRepository';
import { OrgProfile } from '../../../domain/entities/OrgProfile';
import { OrgProfile_Model } from '../../../domain/models/db/dynamo/OrgProfileModel';
import { DynamoRepository } from './base/DynamoRepository';

export class DynamoOrgProfileRepository extends DynamoRepository<OrgProfile> implements IOrgProfileRepository {
  
  constructor() {
    super(OrgProfile_Model);
  }

  protected mapToEntity(item: any): OrgProfile {
    return new OrgProfile(
      item.id,
      item.userId,
      item.orgName,
      item.description,
      item.createdAt,
      item.updatedAt
    );
  }

  async findByUserId(userId: string): Promise<OrgProfile | null> {
    try {
      const result = await this.model.query('userId').eq(userId).using('UserIdIndex').limit(1).exec();
      if (result.count && result.count > 0) {
        return this.mapToEntity(result[0]);
      }
      return null;
    } catch (error) {
      console.error('Error finding OrgProfile by userId:', error);
      return null;
    }
  }
}
