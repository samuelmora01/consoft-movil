import { UserTypes } from "../entities/UserTypes";
import { IRepository } from "./IRepository";

export interface IUserTypesRepository extends IRepository<UserTypes> {
  // Solo necesitamos los métodos básicos del IRepository (findById, create, etc.)
}
