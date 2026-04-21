import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntryEntity } from './entry.entity';
import { EmailVerificationTokenEntity } from './email-verification-token.entity';
import { TABLE_NAMES } from '@/domain/constants';
import { PasswordResetTokenEntity } from './password-reset-token.entity';
import { NotificationEntity } from './notification.entity';
import { UserSettingEntity } from './user-setting.entity';
import { CategoryEntity } from './category.entity';

@Entity(TABLE_NAMES.USERS)
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

  @OneToMany(() => EntryEntity, entry => entry.user)
  entries?: EntryEntity[];

  @OneToMany(() => NotificationEntity, notification => notification.user)
  notifications?: NotificationEntity[];

  @ManyToMany(() => CategoryEntity, category => category.users)
  @JoinTable({
    name: TABLE_NAMES.USER_CATEGORIES,
    joinColumn: { name: 'id_user', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_category', referencedColumnName: 'id' },
  })
  categories: CategoryEntity[];

  @OneToMany(() => EmailVerificationTokenEntity, token => token.user)
  emailVerificationTokens?: EmailVerificationTokenEntity[];

  @OneToMany(() => PasswordResetTokenEntity, token => token.user)
  passwordResetTokens?: PasswordResetTokenEntity[];

  @OneToOne(() => UserSettingEntity, setting => setting.user)
  userSetting?: UserSettingEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
