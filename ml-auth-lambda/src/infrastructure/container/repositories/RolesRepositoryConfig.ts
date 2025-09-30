import { container } from "tsyringe";
import { IRolesRepository } from "../../../domain/repositories/IRolesRepository";
import { RepositoryConstructor } from "../../../domain/types/RepositoryTypes";
import { DynamoRolesRepository } from "../../adapters/dynamo/DynamoRolesRepository";
import dotenv from "dotenv";
dotenv.config();

const repoType = process.env.ROLES_REPOSITORY;

let repoClass: RepositoryConstructor<IRolesRepository>;

switch (repoType) {
  case "DYNAMO":
    repoClass = DynamoRolesRepository;
    break;  
  default:
    repoClass = DynamoRolesRepository;
}

container.register<IRolesRepository>("IRolesRepository", {
  useClass: repoClass
});
