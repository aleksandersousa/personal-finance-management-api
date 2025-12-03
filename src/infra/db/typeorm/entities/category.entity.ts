import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryType } from '@domain/models/category.model';
import { UserEntity } from './user.entity';
import { EntryEntity } from './entry.entity';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
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

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @ManyToOne(() => UserEntity, user => user.categories)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => EntryEntity, entry => entry.category)
  entries: EntryEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
