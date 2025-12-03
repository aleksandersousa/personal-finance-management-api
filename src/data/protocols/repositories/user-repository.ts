import { UserModel } from '@domain/models/user.model';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
}

export interface UserRepository {
  create(userData: CreateUserData): Promise<UserModel>;
  findByEmail(email: string): Promise<UserModel | null>;
  findById(id: string): Promise<UserModel | null>;
  update(id: string, data: Partial<UserModel>): Promise<UserModel>;
}
