import { container } from "tsyringe";
import { IUserRolesRepository } from "../../../domain/repositories/IUserRolesRepository";
import { RepositoryConstructor } from "../../../domain/types/RepositoryTypes";
import { DynamoUserRolesRepository } from "../../adapters/dynamo/DynamoUserRolesRepository";
import dotenv from "dotenv";
dotenv.config();

const repoType = process.env.USERROLES_REPOSITORY;

let repoClass: RepositoryConstructor<IUserRolesRepository>;

switch (repoType) {
  case "DYNAMO":
    repoClass = DynamoUserRolesRepository;
    break;  
  default:
    repoClass = DynamoUserRolesRepository;
}

container.register<IUserRolesRepository>("IUserRolesRepository", {
  useClass: repoClass
});
