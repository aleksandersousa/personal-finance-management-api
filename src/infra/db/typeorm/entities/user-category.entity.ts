import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TABLE_NAMES } from '@/domain/constants';
import { UserEntity } from './user.entity';
import { CategoryEntity } from './category.entity';

@Entity(TABLE_NAMES.USER_CATEGORIES)
export class UserCategoryEntity {
  @PrimaryColumn({ name: 'id_user', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'id_category', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => UserEntity, user => user.userCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_user' })
  user: UserEntity;

  @ManyToOne(() => CategoryEntity, category => category.userCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_category' })
  category: CategoryEntity;
}
