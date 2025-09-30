import { container } from "tsyringe";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { RepositoryConstructor } from "../../../domain/types/RepositoryTypes";
import { DynamoUserRepository } from "../../adapters/dynamo/DynamoUserRepository";

const repoType = process.env.USER_REPOSITORY;

let repoClass: RepositoryConstructor<IUserRepository>;

switch (repoType) {
  case "DYNAMO":
    repoClass = DynamoUserRepository;
    break;  
  default:
    repoClass = DynamoUserRepository;
}

container.register<IUserRepository>("IUserRepository", {
  useClass: repoClass
});
