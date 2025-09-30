import { User } from "../entities/User";
import { IRepository } from "./IRepository";

export interface IUserRepository extends IRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByUserTypeId(userTypeId: string): Promise<User[]>;
  updateStatus(id: string, status: 'unconfirmed' | 'confirmed' | 'suspended'): Promise<User>;
}
