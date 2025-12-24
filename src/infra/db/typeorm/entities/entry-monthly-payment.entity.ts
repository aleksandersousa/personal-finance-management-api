import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntryEntity } from './entry.entity';
import { TABLE_NAMES } from '@/domain/constants';

@Entity(TABLE_NAMES.ENTRY_MONTHLY_PAYMENTS)
@Index(['entryId', 'year', 'month'], { unique: true })
export class EntryMonthlyPaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entry_id', type: 'uuid' })
  entryId: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ name: 'is_paid', type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @ManyToOne(() => EntryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entry_id' })
  entry: EntryEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
