import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TABLE_NAMES } from '@/domain/constants';
import { EntryEntity } from './entry.entity';

@Entity(TABLE_NAMES.PAYMENT)
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_entry', type: 'uuid', unique: true })
  entryId: string;

  @Column({ type: 'bigint' })
  amount: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => EntryEntity, entry => entry.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_entry' })
  entry: EntryEntity;
}
