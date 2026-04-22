import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserData, UserRepository } from '@data/protocols/repositories';
import { UserModel } from '@domain/models/user.model';
import { UserEntity } from '../entities/user.entity';
import { UserSettingEntity } from '../entities/user-setting.entity';

@Injectable()
export class TypeormUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserSettingEntity)
    private readonly userSettingRepository: Repository<UserSettingEntity>,
  ) {}

  async create(userData: CreateUserData): Promise<UserModel> {
    const { user, settings } = await this.userRepository.manager.transaction(
      async manager => {
        const created = manager.create(UserEntity, userData);
        const persisted = await manager.save(created);
        const settingEntity = manager.create(UserSettingEntity, {
          userId: persisted.id,
        });
        const savedSettings = await manager.save(settingEntity);
        return { user: persisted, settings: savedSettings };
      },
    );

    return this.mapUserEntityToModel(user, settings);
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['userSetting'],
    });

    if (!user) {
      return null;
    }

    return this.mapUserEntityToModel(user, user.userSetting);
  }

  async findById(id: string): Promise<UserModel | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['userSetting'],
    });

    if (!user) {
      return null;
    }

    return this.mapUserEntityToModel(user, user.userSetting);
  }

  async update(id: string, data: Partial<UserModel>): Promise<UserModel> {
    const userPayload: Partial<UserEntity> = {};
    if (data.name !== undefined) {
      userPayload.name = data.name;
    }
    if (data.email !== undefined) {
      userPayload.email = data.email;
    }
    if (data.password !== undefined) {
      userPayload.password = data.password;
    }
    if (data.avatarUrl !== undefined) {
      userPayload.avatarUrl = data.avatarUrl;
    }
    if (data.emailVerified !== undefined) {
      userPayload.emailVerified = data.emailVerified;
    }

    if (Object.keys(userPayload).length > 0) {
      await this.userRepository.update(id, userPayload);
    }

    const settingsPayload: Partial<
      Pick<
        UserSettingEntity,
        'notificationsEnabled' | 'notificationsTimeMinutes' | 'timezone'
      >
    > = {};
    if (data.notificationEnabled !== undefined) {
      settingsPayload.notificationsEnabled = data.notificationEnabled;
    }
    if (data.notificationTimeMinutes !== undefined) {
      settingsPayload.notificationsTimeMinutes = data.notificationTimeMinutes;
    }
    if (data.timezone !== undefined) {
      settingsPayload.timezone = data.timezone;
    }

    if (Object.keys(settingsPayload).length > 0) {
      await this.userSettingRepository.update({ userId: id }, settingsPayload);
    }

    const updatedUser = await this.userRepository.findOne({
      where: { id },
      relations: ['userSetting'],
    });

    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    return this.mapUserEntityToModel(updatedUser, updatedUser.userSetting);
  }

  private mapUserEntityToModel(
    user: UserEntity,
    settings?: UserSettingEntity | null,
  ): UserModel {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      notificationEnabled: settings?.notificationsEnabled ?? false,
      notificationTimeMinutes: settings?.notificationsTimeMinutes ?? 30,
      timezone: settings?.timezone ?? 'America/Sao_Paulo',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
