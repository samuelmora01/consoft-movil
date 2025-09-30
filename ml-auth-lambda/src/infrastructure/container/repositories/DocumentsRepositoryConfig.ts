import { container } from "tsyringe";
import { IDocumentsRepository } from "../../../domain/repositories/IDocumentsRepository";
import { RepositoryConstructor } from "../../../domain/types/RepositoryTypes";
import { DynamoDocumentsRepository } from "../../adapters/dynamo/DynamoDocumentsRepository";

const repoType = process.env.DOCUMENTS_REPOSITORY;

let repoClass: RepositoryConstructor<IDocumentsRepository>;

switch (repoType) {
  case "DYNAMO":
    repoClass = DynamoDocumentsRepository;
    break;  
  default:
    repoClass = DynamoDocumentsRepository;
}

container.register<IDocumentsRepository>("IDocumentsRepository", {
  useClass: repoClass
});
