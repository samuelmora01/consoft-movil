import { container } from "tsyringe";
import { IAgencyJoinCodesRepository } from "../../../domain/repositories/IAgencyJoinCodesRepository";
import { RepositoryConstructor } from "../../../domain/types/RepositoryTypes";
import { DynamoAgencyJoinCodesRepository } from "../../adapters/dynamo/DynamoAgencyJoinCodesRepository";
import dotenv from "dotenv";
dotenv.config();

const repoType = process.env.AGENCYJOINCODES_REPOSITORY;

let repoClass: RepositoryConstructor<IAgencyJoinCodesRepository>;

switch (repoType) {
  case "DYNAMO":
    repoClass = DynamoAgencyJoinCodesRepository;
    break;  
  default:
    repoClass = DynamoAgencyJoinCodesRepository;
}

container.register<IAgencyJoinCodesRepository>("IAgencyJoinCodesRepository", {
  useClass: repoClass
});
