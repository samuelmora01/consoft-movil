import { IDocumentTypesRepository } from '../../../domain/repositories/IDocumentTypesRepository';
import { DocumentTypes } from '../../../domain/entities/DocumentTypes';
import { DocumentTypes_Model } from '../../../domain/models/db/dynamo/DocumentTypesModel';
import { DynamoRepository } from './base/DynamoRepository';

export class DynamoDocumentTypesRepository extends DynamoRepository<DocumentTypes> implements IDocumentTypesRepository {
  
  constructor() {
    super(DocumentTypes_Model);
  }

  protected mapToEntity(item: any): DocumentTypes {
    return new DocumentTypes(
      item.id,
      item.attributes || [],
      item.countryId,
      item.createdAt,
      item.updatedAt
    );
  }
}
