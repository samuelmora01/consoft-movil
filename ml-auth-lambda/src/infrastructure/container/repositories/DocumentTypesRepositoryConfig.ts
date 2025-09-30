import { container } from "tsyringe";
import { IDocumentTypesRepository } from "../../../domain/repositories/IDocumentTypesRepository";
import { RepositoryConstructor } from "../../../domain/types/RepositoryTypes";
import { DynamoDocumentTypesRepository } from "../../adapters/dynamo/DynamoDocumentTypesRepository";
import dotenv from "dotenv";
dotenv.config();

const repoType = process.env.DOCUMENTTYPES_REPOSITORY;

let repoClass: RepositoryConstructor<IDocumentTypesRepository>;

switch (repoType) {
  case "DYNAMO":
    repoClass = DynamoDocumentTypesRepository;
    break;  
  default:
    repoClass = DynamoDocumentTypesRepository;
}

container.register<IDocumentTypesRepository>("IDocumentTypesRepository", {
  useClass: repoClass
});
