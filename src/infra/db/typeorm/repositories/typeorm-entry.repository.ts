import { Repository } from 'typeorm';
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateEntryData,
  EntryRepository,
  FindEntriesByMonthFilters,
  FindEntriesByMonthResult,
} from '@data/protocols/entry-repository';
import { EntryModel } from '@domain/models/entry.model';
import { EntryEntity } from '../entities/entry.entity';
import type { Logger, Metrics } from '@/data/protocols';

@Injectable()
export class TypeormEntryRepository implements EntryRepository {
  constructor(
    @InjectRepository(EntryEntity)
    private readonly entryRepository: Repository<EntryEntity>,
    @Inject('Logger')
    private readonly logger: Logger,
    @Inject('Metrics')
    private readonly metrics: Metrics,
  ) {}

  async create(data: CreateEntryData): Promise<EntryModel> {
    const entity = this.entryRepository.create({
      userId: data.userId,
      description: data.description,
      amount: data.amount,
      date: data.date,
      type: data.type,
      isFixed: data.isFixed,
      categoryId: data.categoryId,
    });
    const savedEntry = await this.entryRepository.save(entity);
    return this.mapToModel(savedEntry);
  }

  async findById(id: string): Promise<EntryModel | null> {
    const entry = await this.entryRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    });
    return entry ? this.mapToModel(entry) : null;
  }

  async findByUserId(userId: string): Promise<EntryModel[]> {
    const entries = await this.entryRepository.find({
      where: { userId },
      relations: ['user', 'category'],
      order: { date: 'DESC' },
    });
    return entries.map(this.mapToModel);
  }

  async findByUserIdAndMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<EntryModel[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const entries = await this.entryRepository
      .createQueryBuilder('entry')
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.date >= :startDate', { startDate })
      .andWhere('entry.date <= :endDate', { endDate })
      .leftJoinAndSelect('entry.user', 'user')
      .leftJoinAndSelect('entry.category', 'category')
      .orderBy('entry.date', 'DESC')
      .getMany();

    return entries.map(this.mapToModel);
  }

  async findByUserIdAndMonthWithFilters(
    filters: FindEntriesByMonthFilters,
  ): Promise<FindEntriesByMonthResult> {
    const {
      userId,
      year,
      month,
      page = 1,
      limit = 20,
      sort = 'date',
      order = 'desc',
      type = 'all',
      categoryId,
    } = filters;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Build base query
    let queryBuilder = this.entryRepository
      .createQueryBuilder('entry')
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.date >= :startDate', { startDate })
      .andWhere('entry.date <= :endDate', { endDate })
      .leftJoinAndSelect('entry.user', 'user')
      .leftJoinAndSelect('entry.category', 'category');

    // Apply type filter
    if (type !== 'all') {
      queryBuilder = queryBuilder.andWhere('entry.type = :type', { type });
    }

    // Apply category filter
    if (categoryId && categoryId !== 'all') {
      queryBuilder = queryBuilder.andWhere('entry.categoryId = :categoryId', {
        categoryId,
      });
    }

    // Apply sorting
    const validSortFields = ['date', 'amount', 'description'];
    const sortField = validSortFields.includes(sort) ? sort : 'date';
    queryBuilder = queryBuilder.orderBy(
      `entry.${sortField}`,
      order.toUpperCase() as 'ASC' | 'DESC',
    );

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    // Get paginated results
    const entries = await queryBuilder.getMany();

    // Calculate summary - need separate query for totals without pagination
    const summaryQuery = this.entryRepository
      .createQueryBuilder('entry')
      .select(
        "SUM(CASE WHEN entry.type = 'INCOME' THEN entry.amount ELSE 0 END)",
        'totalIncome',
      )
      .addSelect(
        "SUM(CASE WHEN entry.type = 'EXPENSE' THEN entry.amount ELSE 0 END)",
        'totalExpenses',
      )
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.date >= :startDate', { startDate })
      .andWhere('entry.date <= :endDate', { endDate });

    // Apply same filters to summary query
    if (type !== 'all') {
      summaryQuery.andWhere('entry.type = :type', { type });
    }

    if (categoryId && categoryId !== 'all') {
      summaryQuery.andWhere('entry.categoryId = :categoryId', { categoryId });
    }

    const summaryResult = await summaryQuery.getRawOne();

    return {
      data: entries.map(this.mapToModel),
      total,
      totalIncome: parseFloat(summaryResult?.totalIncome || '0'),
      totalExpenses: parseFloat(summaryResult?.totalExpenses || '0'),
    };
  }

  async update(
    id: string,
    data: Partial<CreateEntryData>,
  ): Promise<EntryModel> {
    const startTime = Date.now();

    try {
      const updateData: any = {};
      if (data.userId) {
        updateData.userId = data.userId;
      }
      if (data.description) {
        updateData.description = data.description;
      }
      if (data.amount !== undefined) {
        updateData.amount = data.amount;
      }
      if (data.date) {
        updateData.date = data.date;
      }
      if (data.type) {
        updateData.type = data.type;
      }
      if (data.isFixed !== undefined) {
        updateData.isFixed = data.isFixed;
      }
      if (data.categoryId !== undefined) {
        updateData.categoryId = data.categoryId;
      }

      await this.entryRepository.update(id, updateData);
      const updatedEntry = await this.entryRepository.findOne({
        where: { id },
        relations: ['user', 'category'],
      });

      if (!updatedEntry) {
        throw new Error('Entry not found');
      }

      const duration = Date.now() - startTime;

      // Log business event
      this.logger.logBusinessEvent({
        event: 'entry_updated',
        entityId: id,
        userId: data.userId || 'unknown',
        duration,
        changes: Object.keys(updateData),
      });

      // Record metrics
      this.metrics.recordTransaction('update', 'success');

      return this.mapToModel(updatedEntry);
    } catch (error) {
      // Log error
      this.logger.error(`Failed to update entry ${id}`, error.stack);

      // Record error metrics
      this.metrics.recordApiError('entry_repository_update', error.message);

      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.entryRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Entry not found');
    }
  }

  async softDelete(id: string): Promise<Date> {
    try {
      const deletedAt = new Date();
      const result = await this.entryRepository.update(id, { deletedAt });

      if (result.affected === 0) {
        this.logger.error(
          'Failed to soft delete entry - entry not found',
          '',
          'TypeormEntryRepository',
        );
        this.metrics.recordTransaction('delete', 'not_found');
        throw new Error('Entry not found');
      }

      this.logger.log('Entry soft deleted', 'TypeormEntryRepository');

      this.metrics.recordTransaction('delete', 'success');
      return deletedAt;
    } catch (error) {
      this.metrics.recordTransaction('delete', 'error');
      this.logger.error(`Failed to soft delete entry ${id}`, error.stack);
      throw error;
    }
  }

  private mapToModel(entity: EntryEntity): EntryModel {
    return {
      id: entity.id,
      userId: entity.userId,
      description: entity.description,
      amount: Number(entity.amount),
      date: entity.date,
      type: entity.type,
      isFixed: entity.isFixed,
      categoryId: entity.categoryId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
