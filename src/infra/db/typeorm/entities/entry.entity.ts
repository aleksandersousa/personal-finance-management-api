import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntryType } from '@domain/models/entry.model';
import { UserEntity } from './user.entity';
import { CategoryEntity } from './category.entity';

@Entity('entries')
export class EntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'timestamp' })
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
}
