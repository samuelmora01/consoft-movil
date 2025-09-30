import { container } from "tsyringe";
import { IPersonProfileRepository } from "../../../domain/repositories/IPersonProfileRepository";
import { RepositoryConstructor } from "../../../domain/types/RepositoryTypes";
import { DynamoPersonProfileRepository } from "../../adapters/dynamo/DynamoPersonProfileRepository";

const repoType = process.env.PERSONPROFILE_REPOSITORY;

let repoClass: RepositoryConstructor<IPersonProfileRepository>;

switch (repoType) {
  case "DYNAMO":
    repoClass = DynamoPersonProfileRepository;
    break;  
  default:
    repoClass = DynamoPersonProfileRepository;
}

container.register<IPersonProfileRepository>("IPersonProfileRepository", {
  useClass: repoClass
});
