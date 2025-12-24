import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { EntryType } from '@domain/models/entry.model';
import { UserEntity } from './user.entity';
import { CategoryEntity } from './category.entity';
import { TABLE_NAMES } from '@/domain/constants';

@Entity(TABLE_NAMES.ENTRIES)
export class EntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({
    type: 'enum',
    enum: ['INCOME', 'EXPENSE'],
  })
  type: EntryType;

  @Column({ name: 'is_fixed', default: false })
  isFixed: boolean;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string | null;

  @Column({ name: 'is_paid', default: false })
  isPaid: boolean;

  @Column({
    name: 'notification_time_minutes',
    type: 'integer',
    nullable: true,
  })
  notificationTimeMinutes: number | null;

  @ManyToOne(() => UserEntity, user => user.entries)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => CategoryEntity, category => category.entries, {
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
