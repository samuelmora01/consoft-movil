import { container } from "tsyringe";
import { IOrgProfileRepository } from "../../../domain/repositories/IOrgProfileRepository";
import { RepositoryConstructor } from "../../../domain/types/RepositoryTypes";
import { DynamoOrgProfileRepository } from "../../adapters/dynamo/DynamoOrgProfileRepository";

const repoType = process.env.ORGPROFILE_REPOSITORY;

let repoClass: RepositoryConstructor<IOrgProfileRepository>;

switch (repoType) {
  case "DYNAMO":
    repoClass = DynamoOrgProfileRepository;
    break;  
  default:
    repoClass = DynamoOrgProfileRepository;
}

container.register<IOrgProfileRepository>("IOrgProfileRepository", {
  useClass: repoClass
});
