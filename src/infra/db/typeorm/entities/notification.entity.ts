import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { NotificationStatus } from '@domain/models/notification.model';
import { UserEntity } from './user.entity';
import { EntryEntity } from './entry.entity';
import { TABLE_NAMES } from '@/domain/constants';

@Entity(TABLE_NAMES.NOTIFICATIONS)
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entry_id' })
  entryId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  @Index(`IDX_${TABLE_NAMES.NOTIFICATIONS}_scheduled_at`)
  scheduledAt: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  @Index(`IDX_${TABLE_NAMES.NOTIFICATIONS}_status`)
  status: NotificationStatus;

  @Column({ name: 'job_id', nullable: true })
  jobId: string | null;

  @ManyToOne(() => EntryEntity)
  @JoinColumn({ name: 'entry_id' })
  entry: EntryEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
