import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryType } from '@domain/models/category.model';
import { EntryEntity } from './entry.entity';
import { TABLE_NAMES } from '@/domain/constants';
import { UserCategoryEntity } from './user-category.entity';

@Entity(TABLE_NAMES.CATEGORIES)
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
  })
  type: CategoryType;

  @Column({ length: 7, nullable: true })
  color?: string;

  @Column({ length: 50, nullable: true })
  icon?: string;

  userId?: string;

  isDefault?: boolean;

  @OneToMany(() => EntryEntity, entry => entry.category)
  entries: EntryEntity[];

  @OneToMany(() => UserCategoryEntity, userCategory => userCategory.category)
  userCategories: UserCategoryEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  deletedAt?: Date | null;
}
