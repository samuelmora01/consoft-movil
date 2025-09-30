import { container } from "tsyringe";
import { IUserTypesRepository } from "../../../domain/repositories/IUserTypesRepository";
import { RepositoryConstructor } from "../../../domain/types/RepositoryTypes";
import { DynamoUserTypesRepository } from "../../adapters/dynamo/DynamoUserTypesRepository";

const repoType = process.env.USERTYPES_REPOSITORY;

let repoClass: RepositoryConstructor<IUserTypesRepository>;

switch (repoType) {
  case "DYNAMO":
    repoClass = DynamoUserTypesRepository;
    break;  
  default:
    repoClass = DynamoUserTypesRepository;
}

container.register<IUserTypesRepository>("IUserTypesRepository", {
  useClass: repoClass
});
