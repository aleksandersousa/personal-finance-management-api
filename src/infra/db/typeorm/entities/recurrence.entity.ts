import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TABLE_NAMES } from '@/domain/constants';
import { EntryEntity } from './entry.entity';

@Entity(TABLE_NAMES.RECURRENCES)
export class RecurrenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  type: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => EntryEntity, entry => entry.recurrence)
  entries: EntryEntity[];
}
