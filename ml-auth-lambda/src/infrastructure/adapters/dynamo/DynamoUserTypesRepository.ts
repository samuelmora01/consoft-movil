import { IUserTypesRepository } from '../../../domain/repositories/IUserTypesRepository';
import { UserTypes } from '../../../domain/entities/UserTypes';
import { UserTypes_Model } from '../../../domain/models/db/dynamo/UserTypesModel';
import { DynamoRepository } from './base/DynamoRepository';

export class DynamoUserTypesRepository extends DynamoRepository<UserTypes> implements IUserTypesRepository {
  
  constructor() {
    super(UserTypes_Model);
  }

  protected mapToEntity(item: any): UserTypes {
    return new UserTypes(
      item.id,
      item.description,
      item.createdAt,
      item.updatedAt
    );
  }

}
