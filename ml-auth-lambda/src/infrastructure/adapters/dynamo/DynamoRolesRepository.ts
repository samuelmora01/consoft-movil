import { IRolesRepository } from '../../../domain/repositories/IRolesRepository';
import { Roles } from '../../../domain/entities/Roles';
import { Roles_Model } from '../../../domain/models/db/dynamo/RolesModel';
import { DynamoRepository } from './base/DynamoRepository';

export class DynamoRolesRepository extends DynamoRepository<Roles> implements IRolesRepository {
  
  constructor() {
    super(Roles_Model);
  }

  protected mapToEntity(item: any): Roles {
    return new Roles(
      item.id,
      item.code,
      item.scope,
      item.permissions || [],
      item.status,
      item.createdAt,
      item.updatedAt,
      item.description
    );
  }

  async findByCode(code: string): Promise<Roles | null> {
    try {
      const result = await this.model.query('code').eq(code).using('CodeIndex').exec();
      return result.count > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error) {
      console.error(`Error finding role by code ${code}:`, error);
      return null;
    }
  }
}
