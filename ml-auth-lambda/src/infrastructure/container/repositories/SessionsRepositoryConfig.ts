import { container } from "tsyringe";
import { ISessionsRepository } from "../../../domain/repositories/ISessionsRepository";
import { RepositoryConstructor } from "../../../domain/types/RepositoryTypes";
import { DynamoSessionsRepository } from "../../adapters/dynamo/DynamoSessionsRepository";

const repoType = process.env.SESSIONS_REPOSITORY;

let repoClass: RepositoryConstructor<ISessionsRepository>;

switch (repoType) {
  case "DYNAMO":
    repoClass = DynamoSessionsRepository;
    break;  
  default:
    repoClass = DynamoSessionsRepository;
}

container.register<ISessionsRepository>("ISessionsRepository", {
  useClass: repoClass
});
