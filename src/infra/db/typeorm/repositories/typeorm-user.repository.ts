import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserData, UserRepository } from '@data/protocols/repositories';
import { UserModel } from '@domain/models/user.model';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class TypeormUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(userData: CreateUserData): Promise<UserModel> {
    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      password: savedUser.password,
      avatarUrl: savedUser.avatarUrl,
      emailVerified: savedUser.emailVerified,
      notificationEnabled: savedUser.notificationEnabled,
      notificationTimeMinutes: savedUser.notificationTimeMinutes,
      timezone: savedUser.timezone,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      notificationEnabled: user.notificationEnabled,
      notificationTimeMinutes: user.notificationTimeMinutes,
      timezone: user.timezone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findById(id: string): Promise<UserModel | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      notificationEnabled: user.notificationEnabled,
      notificationTimeMinutes: user.notificationTimeMinutes,
      timezone: user.timezone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async update(id: string, data: Partial<UserModel>): Promise<UserModel> {
    await this.userRepository.update(id, data);
    const updatedUser = await this.userRepository.findOne({
      where: { id },
    });

    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      password: updatedUser.password,
      avatarUrl: updatedUser.avatarUrl,
      emailVerified: updatedUser.emailVerified,
      notificationEnabled: updatedUser.notificationEnabled,
      notificationTimeMinutes: updatedUser.notificationTimeMinutes,
      timezone: updatedUser.timezone,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
