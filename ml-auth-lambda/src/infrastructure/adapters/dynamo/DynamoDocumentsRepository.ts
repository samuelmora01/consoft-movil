import { IDocumentsRepository } from '../../../domain/repositories/IDocumentsRepository';
import { Documents } from '../../../domain/entities/Documents';
import { Documents_Model } from '../../../domain/models/db/dynamo/DocumentsModel';
import { DynamoRepository } from './base/DynamoRepository';

export class DynamoDocumentsRepository extends DynamoRepository<Documents> implements IDocumentsRepository {
  
  constructor() {
    super(Documents_Model);
  }

  protected mapToEntity(item: any): Documents {
    return new Documents(
      item.id,
      item.userId,
      item.documentTypeId,
      item.details,
      item.createdAt,
      item.updatedAt
    );
  }

  async findByDocumentNumber(documentTypeId: string, documentNumber: string): Promise<Documents | null> {
    try {
      const result = await this.model.scan()
        .where('documentTypeId').eq(documentTypeId)
        .and()
        .where('details.documentNumber').eq(documentNumber)
        .exec();
      return result.count > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error) {
      console.error('Error finding document by number:', error);
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Documents[]> {
    try {
      const result = await this.model.query('userId').eq(userId).using('UserIdIndex').exec();
      return result.map((item: any) => this.mapToEntity(item));
    } catch (error) {
      console.error('Error finding documents by userId:', error);
      return [];
    }
  }
}
