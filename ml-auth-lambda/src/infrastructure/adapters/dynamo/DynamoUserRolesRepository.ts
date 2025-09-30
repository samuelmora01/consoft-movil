import { IUserRolesRepository } from '../../../domain/repositories/IUserRolesRepository';
import { UserRoles } from '../../../domain/entities/UserRoles';
import { UserRoles_Model } from '../../../domain/models/db/dynamo/UserRolesModel';
import { DynamoRepository } from './base/DynamoRepository';

export class DynamoUserRolesRepository extends DynamoRepository<UserRoles> implements IUserRolesRepository {
  
  constructor() {
    super(UserRoles_Model);
  }

  protected mapToEntity(item: any): UserRoles {
    return new UserRoles(
      item.id,
      item.userId,
      item.roleId,
      item.createdAt,
      item.updatedAt
    );
  }

  async findByUserId(userId: string): Promise<UserRoles[]> {
    try {
      const result = await this.model.query('userId').eq(userId).using('UserIdIndex').exec();
      return result.map((item: any) => this.mapToEntity(item));
    } catch (error) {
      console.error('Error finding UserRoles by userId:', error);
      return [];
    }
  }
}
