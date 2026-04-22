import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationStatus } from '@domain/models/notification.model';
import { UserEntity } from './user.entity';
import { EntryEntity } from './entry.entity';
import { TABLE_NAMES } from '@/domain/constants';

@Entity(TABLE_NAMES.NOTIFICATIONS)
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_entry' })
  entryId: string;

  @Column({ name: 'id_user' })
  userId: string;

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'varchar' })
  status: NotificationStatus;

  @Column({ name: 'job_id', nullable: true })
  jobId: string | null;

  @ManyToOne(() => EntryEntity)
  @JoinColumn({ name: 'id_entry' })
  entry: EntryEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'id_user' })
  user: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
