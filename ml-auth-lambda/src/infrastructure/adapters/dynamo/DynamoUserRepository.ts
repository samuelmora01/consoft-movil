import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { User_Model } from '../../../domain/models/db/dynamo/UserModel';
import { DynamoRepository } from './base/DynamoRepository';

export class DynamoUserRepository extends DynamoRepository<User> implements IUserRepository {
  
  constructor() {
    super(User_Model);
  }

  protected mapToEntity(item: any): User {
    return new User(
      item.id,
      item.email,
      item.status,
      item.userTypeId,
      item.countryId,
      item.createdAt,
      item.updatedAt
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.model.query('email').eq(email).using('EmailIndex').exec();
      return result.count > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findByUserTypeId(userTypeId: string): Promise<User[]> {
    try {
      const result = await this.model.scan().where('userTypeId').eq(userTypeId).exec();
      return result.map((item: any) => this.mapToEntity(item));
    } catch (error) {
      console.error('Error finding users by userTypeId:', error);
      return [];
    }
  }

  async updateStatus(id: string, status: 'unconfirmed' | 'confirmed' | 'suspended'): Promise<User> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      await this.model.update({ id }, { status });
      user.status = status;
      user.updatedAt = new Date().toISOString();
      
      return user;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }
}
