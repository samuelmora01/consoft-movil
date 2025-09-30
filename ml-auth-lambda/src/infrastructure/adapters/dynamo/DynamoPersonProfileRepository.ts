import { IPersonProfileRepository } from '../../../domain/repositories/IPersonProfileRepository';
import { PersonProfile } from '../../../domain/entities/PersonProfile';
import { PersonProfile_Model } from '../../../domain/models/db/dynamo/PersonProfileModel';
import { DynamoRepository } from './base/DynamoRepository';

export class DynamoPersonProfileRepository extends DynamoRepository<PersonProfile> implements IPersonProfileRepository {
  
  constructor() {
    super(PersonProfile_Model);
  }

  protected mapToEntity(item: any): PersonProfile {
    return new PersonProfile(
      item.id,
      item.userId,
      item.firstName,
      item.lastName,
      item.hasOrgMembership,
      item.birthDate,
      item.createdAt,
      item.updatedAt
    );
  }

  async findByUserId(userId: string): Promise<PersonProfile | null> {
    try {
      const result = await this.model.query('userId').eq(userId).using('UserIdIndex').limit(1).exec();
      if (result.count && result.count > 0) {
        return this.mapToEntity(result[0]);
      }
      return null;
    } catch (error) {
      console.error('Error finding PersonProfile by userId:', error);
      return null;
    }
  }
}
