import { Repository } from 'typeorm';
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateEntryData,
  EntryRepository,
  FindEntriesByMonthFilters,
  FindEntriesByMonthResult,
  MonthlySummaryStats,
  CategorySummaryResult,
  FixedEntriesSummary,
  MonthYear,
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
      search,
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

    // Apply search filter (case-insensitive)
    if (search && search.trim()) {
      queryBuilder = queryBuilder.andWhere('entry.description ILIKE :search', {
        search: `%${search.trim()}%`,
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

    if (search && search.trim()) {
      summaryQuery.andWhere('entry.description ILIKE :search', {
        search: `%${search.trim()}%`,
      });
    }

    const summaryResult = await summaryQuery.getRawOne();

    const data = entries.map(this.mapToModel);

    return {
      data,
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

  async getMonthlySummaryStats(
    userId: string,
    year: number,
    month: number,
  ): Promise<MonthlySummaryStats> {
    const startTime = Date.now();

    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const result = await this.entryRepository
        .createQueryBuilder('entry')
        .select(
          "SUM(CASE WHEN entry.type = 'INCOME' THEN entry.amount ELSE 0 END)",
          'totalIncome',
        )
        .addSelect(
          "SUM(CASE WHEN entry.type = 'EXPENSE' THEN entry.amount ELSE 0 END)",
          'totalExpenses',
        )
        .addSelect(
          "SUM(CASE WHEN entry.type = 'INCOME' AND entry.isFixed = true THEN entry.amount ELSE 0 END)",
          'fixedIncome',
        )
        .addSelect(
          "SUM(CASE WHEN entry.type = 'INCOME' AND entry.isFixed = false THEN entry.amount ELSE 0 END)",
          'dynamicIncome',
        )
        .addSelect(
          "SUM(CASE WHEN entry.type = 'EXPENSE' AND entry.isFixed = true THEN entry.amount ELSE 0 END)",
          'fixedExpenses',
        )
        .addSelect(
          "SUM(CASE WHEN entry.type = 'EXPENSE' AND entry.isFixed = false THEN entry.amount ELSE 0 END)",
          'dynamicExpenses',
        )
        .addSelect('COUNT(*)', 'totalEntries')
        .addSelect(
          "COUNT(CASE WHEN entry.type = 'INCOME' THEN 1 END)",
          'incomeEntries',
        )
        .addSelect(
          "COUNT(CASE WHEN entry.type = 'EXPENSE' THEN 1 END)",
          'expenseEntries',
        )
        .where('entry.userId = :userId', { userId })
        .andWhere('entry.date >= :startDate', { startDate })
        .andWhere('entry.date <= :endDate', { endDate })
        .andWhere('entry.deletedAt IS NULL')
        .getRawOne();

      const duration = Date.now() - startTime;

      // Log business event
      this.logger.logBusinessEvent({
        event: 'monthly_summary_stats_calculated',
        userId,
        metadata: {
          year,
          month,
          duration,
        },
      });

      // Record metrics
      this.metrics.recordTransaction('get_monthly_summary_stats', 'success');

      return {
        totalIncome: parseFloat(result?.totalIncome || '0'),
        totalExpenses: parseFloat(result?.totalExpenses || '0'),
        fixedIncome: parseFloat(result?.fixedIncome || '0'),
        dynamicIncome: parseFloat(result?.dynamicIncome || '0'),
        fixedExpenses: parseFloat(result?.fixedExpenses || '0'),
        dynamicExpenses: parseFloat(result?.dynamicExpenses || '0'),
        totalEntries: parseInt(result?.totalEntries || '0'),
        incomeEntries: parseInt(result?.incomeEntries || '0'),
        expenseEntries: parseInt(result?.expenseEntries || '0'),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get monthly summary stats for user ${userId}`,
        error.stack,
      );

      this.metrics.recordApiError('get_monthly_summary_stats', error.message);

      throw error;
    }
  }

  async getCategorySummaryForMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<CategorySummaryResult> {
    const startTime = Date.now();

    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get all results first to count total (before limiting to top 3)
      // This is acceptable since category summaries are typically small datasets
      const allResults = await this.entryRepository
        .createQueryBuilder('entry')
        .leftJoin('entry.category', 'category')
        .select([
          'entry.categoryId',
          'category.name',
          'entry.type',
          'SUM(entry.amount)',
          'COUNT(*)',
        ])
        .where('entry.userId = :userId', { userId })
        .andWhere('entry.date >= :startDate', { startDate })
        .andWhere('entry.date <= :endDate', { endDate })
        .andWhere('entry.deletedAt IS NULL')
        .andWhere('entry.categoryId IS NOT NULL')
        .groupBy('entry.categoryId, category.name, entry.type')
        .orderBy('SUM(entry.amount)', 'DESC')
        .getRawMany();

      // Calculate totals by type
      const incomeTotal = allResults.filter(
        result => result.entry_type === 'INCOME',
      ).length;
      const expenseTotal = allResults.filter(
        result => result.entry_type === 'EXPENSE',
      ).length;

      // Take top 3 items
      const results = allResults.slice(0, 3);

      const duration = Date.now() - startTime;

      // Log business event
      this.logger.logBusinessEvent({
        event: 'category_summary_calculated',
        userId,
        metadata: {
          year,
          month,
          categoriesCount: results.length,
          incomeTotal,
          expenseTotal,
          duration,
        },
      });

      // Record metrics
      this.metrics.recordTransaction('get_category_summary', 'success');

      const items = results.map(result => ({
        categoryId: result.entry_categoryId,
        categoryName: result.category_name || 'Unknown Category',
        type: result.entry_type,
        total: parseFloat(result.sum || '0'),
        count: parseInt(result.count || '0'),
      }));

      return {
        items,
        incomeTotal,
        expenseTotal,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get category summary for user ${userId}`,
        error.stack,
      );

      this.metrics.recordApiError('get_category_summary', error.message);

      throw error;
    }
  }

  async getFixedEntriesSummary(userId: string): Promise<FixedEntriesSummary> {
    const startTime = Date.now();

    try {
      const result = await this.entryRepository
        .createQueryBuilder('entry')
        .select(
          "SUM(CASE WHEN entry.type = 'INCOME' AND entry.isFixed = true THEN entry.amount ELSE 0 END)",
          'fixedIncome',
        )
        .addSelect(
          "SUM(CASE WHEN entry.type = 'EXPENSE' AND entry.isFixed = true THEN entry.amount ELSE 0 END)",
          'fixedExpenses',
        )
        .addSelect(
          'COUNT(CASE WHEN entry.isFixed = true THEN 1 END)',
          'entriesCount',
        )
        .where('entry.userId = :userId', { userId })
        .andWhere('entry.deletedAt IS NULL')
        .getRawOne();

      const fixedIncome = parseFloat(result?.fixedIncome || '0');
      const fixedExpenses = parseFloat(result?.fixedExpenses || '0');
      const fixedNetFlow = fixedIncome - fixedExpenses;

      const duration = Date.now() - startTime;

      // Log business event
      this.logger.logBusinessEvent({
        event: 'fixed_entries_summary_calculated',
        userId,
        metadata: {
          fixedIncome,
          fixedExpenses,
          fixedNetFlow,
          entriesCount: parseInt(result?.entriesCount || '0'),
          duration,
        },
      });

      // Record metrics
      this.metrics.recordTransaction('get_fixed_entries_summary', 'success');

      return {
        fixedIncome,
        fixedExpenses,
        fixedNetFlow,
        entriesCount: parseInt(result?.entriesCount || '0'),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get fixed entries summary for user ${userId}`,
        error.stack,
      );

      this.metrics.recordApiError('get_fixed_entries_summary', error.message);
      throw error;
    }
  }

  async getCurrentBalance(userId: string): Promise<number> {
    const startTime = Date.now();

    try {
      const result = await this.entryRepository
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
        .andWhere('entry.deletedAt IS NULL')
        .getRawOne();

      const totalIncome = parseFloat(result?.totalIncome || '0');
      const totalExpenses = parseFloat(result?.totalExpenses || '0');
      const currentBalance = totalIncome - totalExpenses;

      const duration = Date.now() - startTime;

      // Log business event
      this.logger.logBusinessEvent({
        event: 'current_balance_calculated',
        userId,
        metadata: {
          totalIncome,
          totalExpenses,
          currentBalance,
          duration,
        },
      });

      // Record metrics
      this.metrics.recordTransaction('get_current_balance', 'success');

      return currentBalance;
    } catch (error) {
      this.logger.error(
        `Failed to get current balance for user ${userId}`,
        error.stack,
      );

      this.metrics.recordApiError('get_current_balance', error.message);
      throw error;
    }
  }

  async getDistinctMonthsYears(userId: string): Promise<MonthYear[]> {
    const startTime = Date.now();

    try {
      const results = await this.entryRepository
        .createQueryBuilder('entry')
        .select('EXTRACT(YEAR FROM entry.date)', 'year')
        .addSelect('EXTRACT(MONTH FROM entry.date)', 'month')
        .where('entry.userId = :userId', { userId })
        .andWhere('entry.deletedAt IS NULL')
        .groupBy('EXTRACT(YEAR FROM entry.date)')
        .addGroupBy('EXTRACT(MONTH FROM entry.date)')
        .orderBy('EXTRACT(YEAR FROM entry.date)', 'DESC')
        .addOrderBy('EXTRACT(MONTH FROM entry.date)', 'DESC')
        .getRawMany();

      const monthsYears: MonthYear[] = results.map(result => ({
        year: parseInt(result.year, 10),
        month: parseInt(result.month, 10),
      }));

      const duration = Date.now() - startTime;

      // Log business event
      this.logger.logBusinessEvent({
        event: 'distinct_months_years_retrieved',
        userId,
        metadata: {
          count: monthsYears.length,
          duration,
        },
      });

      // Record metrics
      this.metrics.recordTransaction('get_distinct_months_years', 'success');

      return monthsYears;
    } catch (error) {
      this.logger.error(
        `Failed to get distinct months and years for user ${userId}`,
        error.stack,
      );

      this.metrics.recordApiError('get_distinct_months_years', error.message);
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
      categoryName: entity.category?.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
