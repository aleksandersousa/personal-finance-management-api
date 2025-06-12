import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { CategoryType } from '@domain/models/category.model';
import { UserEntity } from './user.entity';
import { EntryEntity } from './entry.entity';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['INCOME', 'EXPENSE'],
  })
  type: CategoryType;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.categories)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => EntryEntity, (entry) => entry.category)
  entries: EntryEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 