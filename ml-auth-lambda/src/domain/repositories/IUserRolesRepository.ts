import { UserRoles } from "../entities/UserRoles";
import { IRepository } from "./IRepository";

export interface IUserRolesRepository extends IRepository<UserRoles> {
  findByUserId(userId: string): Promise<UserRoles[]>;
}
