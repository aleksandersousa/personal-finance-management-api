import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryType } from '@domain/models/category.model';
import { EntryEntity } from './entry.entity';
import { TABLE_NAMES } from '@/domain/constants';
import { UserEntity } from './user.entity';

@Entity(TABLE_NAMES.CATEGORIES)
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  icon?: string;

  @Column({ type: 'varchar', nullable: true })
  color?: string;

  @Column({ type: 'varchar' })
  type: CategoryType;

  @OneToMany(() => EntryEntity, entry => entry.category)
  entries: EntryEntity[];

  @ManyToMany(() => UserEntity, user => user.categories)
  users: UserEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
