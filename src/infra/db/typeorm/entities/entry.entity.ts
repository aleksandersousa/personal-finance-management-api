import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { CategoryEntity } from './category.entity';
import { TABLE_NAMES } from '@/domain/constants';
import { RecurrenceEntity } from './recurrence.entity';
import { PaymentEntity } from './payment.entity';
import { NotificationEntity } from './notification.entity';

@Entity(TABLE_NAMES.ENTRIES)
export class EntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_user' })
  userId: string;

  @Column({ name: 'id_category', nullable: true })
  categoryId: string | null;

  @Column({ name: 'id_recurrence', nullable: true })
  recurrenceId: string | null;

  @Column()
  description: string;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: Date;

  @Column({ name: 'due_date', type: 'timestamp' })
  dueDate: Date;

  @ManyToOne(() => UserEntity, user => user.entries)
  @JoinColumn({ name: 'id_user' })
  user: UserEntity;

  @ManyToOne(() => CategoryEntity, category => category.entries, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_category' })
  category: CategoryEntity;

  @ManyToOne(() => RecurrenceEntity, recurrence => recurrence.entries, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_recurrence' })
  recurrence: RecurrenceEntity;

  @OneToMany(() => NotificationEntity, notification => notification.entry)
  notifications: NotificationEntity[];

  @OneToOne(() => PaymentEntity, payment => payment.entry)
  payment?: PaymentEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
