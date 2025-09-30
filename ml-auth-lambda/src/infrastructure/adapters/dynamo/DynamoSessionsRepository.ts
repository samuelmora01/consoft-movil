import { ISessionsRepository } from '../../../domain/repositories/ISessionsRepository';
import { Sessions } from '../../../domain/entities/Sessions';
import { Sessions_Model } from '../../../domain/models/db/dynamo/SessionsModel';
import { DynamoRepository } from './base/DynamoRepository';

export class DynamoSessionsRepository extends DynamoRepository<Sessions> implements ISessionsRepository {
  
  constructor() {
    super(Sessions_Model);
  }

  protected mapToEntity(item: any): Sessions {
    return new Sessions(
      item.id,
      item.userId,
      item.lastSession,
      item.appVersion,
      item.platform,
      item.ip,
      item.geo,
      item.createdAt,
      item.updatedAt
    );
  }
}
