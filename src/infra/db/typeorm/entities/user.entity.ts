import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntryEntity } from './entry.entity';
import { CategoryEntity } from './category.entity';
import { EmailVerificationTokenEntity } from './email-verification-token.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ name: 'notification_enabled', type: 'boolean', default: true })
  notificationEnabled: boolean;

  @Column({ name: 'notification_time_minutes', type: 'integer', default: 30 })
  notificationTimeMinutes: number;

  @Column({ name: 'timezone', default: 'America/Sao_Paulo' })
  timezone: string;

  @OneToMany(() => EntryEntity, entry => entry.user)
  entries: EntryEntity[];

  @OneToMany(() => CategoryEntity, category => category.user)
  categories: CategoryEntity[];

  @OneToMany(() => EmailVerificationTokenEntity, token => token.user)
  emailVerificationTokens: EmailVerificationTokenEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
