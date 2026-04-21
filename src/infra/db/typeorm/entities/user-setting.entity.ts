import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TABLE_NAMES } from '@/domain/constants';
import { UserEntity } from './user.entity';

@Entity(TABLE_NAMES.USER_SETTINGS)
export class UserSettingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_user', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'notifications_enabled', type: 'boolean', default: false })
  notificationsEnabled: boolean;

  @Column({ name: 'notifications_time_minutes', type: 'int', default: 30 })
  notificationsTimeMinutes: number;

  @Column({ default: 'America/Sao_Paulo' })
  timezone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, user => user.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_user' })
  user: UserEntity;
}
