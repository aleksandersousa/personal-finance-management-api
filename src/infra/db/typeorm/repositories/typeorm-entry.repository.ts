import { Repository } from 'typeorm';
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateEntryData,
  UpdateEntryData,
  EntryRepository,
  FindEntriesByMonthFilters,
  FindEntriesByMonthResult,
  MonthlySummaryStats,
  CategorySummaryResult,
  FixedEntriesSummary,
  MonthYear,
  AccumulatedStats,
  CategorySummaryItem,
  ToggleEntryPaymentStatusResult,
} from '@/data/protocols/repositories/entry-repository';
import { EntryModel } from '@domain/models/entry.model';
import { EntryEntity } from '../entities/entry.entity';
import { PaymentEntity } from '../entities/payment.entity';
import type { Logger, Metrics } from '@/data/protocols';

@Injectable()
export class TypeormEntryRepository implements EntryRepository {
  constructor(
    @InjectRepository(EntryEntity)
    private readonly entryRepository: Repository<EntryEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @Inject('Logger')
    private readonly logger: Logger,
    @Inject('Metrics')
    private readonly metrics: Metrics,
  ) {}

  async create(data: CreateEntryData): Promise<EntryModel> {
    const entity = this.entryRepository.create({
      userId: data.userId,
      categoryId: data.categoryId,
      recurrenceId: data.recurrenceId,
      description: data.description,
      amount: data.amount,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
    });
    const saved = await this.entryRepository.save(entity);
    return this.mapToModel(saved);
  }

  async findById(id: string): Promise<EntryModel | null> {
    const entry = await this.entryRepository.findOne({
      where: { id },
      relations: ['category', 'recurrence', 'payment'],
    });
    return entry ? this.mapToModel(entry) : null;
  }

  async findByUserId(userId: string): Promise<EntryModel[]> {
    const entries = await this.entryRepository.find({
      where: { userId },
      relations: ['category', 'recurrence', 'payment'],
      order: { dueDate: 'DESC' },
    });
    return entries.map(entry => this.mapToModel(entry));
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
      .leftJoinAndSelect('entry.category', 'category')
      .leftJoinAndSelect('entry.recurrence', 'recurrence')
      .leftJoinAndSelect('entry.payment', 'payment')
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.dueDate >= :startDate', { startDate })
      .andWhere('entry.dueDate <= :endDate', { endDate })
      .orderBy('entry.dueDate', 'DESC')
      .getMany();
    return entries.map(entry => this.mapToModel(entry));
  }

  async findByUserIdAndMonthWithFilters(
    filters: FindEntriesByMonthFilters,
  ): Promise<FindEntriesByMonthResult> {
    const startTime = Date.now();
    const {
      userId,
      year,
      month,
      page = 1,
      limit = 20,
      sort,
      order,
      categoryId,
      search,
    } = filters;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const query = this.entryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.category', 'category')
      .leftJoinAndSelect('entry.recurrence', 'recurrence')
      .leftJoinAndSelect('entry.payment', 'payment')
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.dueDate >= :startDate', { startDate })
      .andWhere('entry.dueDate <= :endDate', { endDate });

    if (categoryId && categoryId !== 'all') {
      query.andWhere('entry.categoryId = :categoryId', { categoryId });
    }
    if (search && search.trim()) {
      query.andWhere('entry.description ILIKE :search', {
        search: `%${search.trim()}%`,
      });
    }

    const validSort = ['dueDate', 'amount', 'description'];
    const sortField = validSort.includes(sort || '') ? sort! : 'dueDate';
    const sortOrder = (order || 'desc').toUpperCase() as 'ASC' | 'DESC';
    query
      .orderBy(`entry.${sortField}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [entries, total] = await query.getManyAndCount();

    let totalIncome = 0;
    let totalExpenses = 0;
    entries.forEach(entry => {
      const value = Number(entry.amount);
      if (entry.category?.type === 'INCOME') {
        totalIncome += value;
      } else if (entry.category?.type === 'EXPENSE' && entry.payment) {
        totalExpenses += value;
      }
    });

    this.metrics.recordDbQuery(
      'find_entries_by_month_with_filters',
      'entries',
      'success',
      Date.now() - startTime,
    );

    return {
      data: entries.map(entry => this.mapToModel(entry)),
      total,
      totalIncome,
      totalExpenses,
    };
  }

  async getMonthlySummaryStats(
    userId: string,
    year: number,
    month: number,
  ): Promise<MonthlySummaryStats> {
    const entries = await this.findByUserIdAndMonth(userId, year, month);
    let totalIncome = 0;
    let totalPaidExpenses = 0;
    const totalUnpaidExpenses = 0;
    let fixedIncome = 0;
    let dynamicIncome = 0;
    let fixedPaidExpenses = 0;
    let fixedUnpaidExpenses = 0;
    let dynamicPaidExpenses = 0;
    let dynamicUnpaidExpenses = 0;
    let incomeEntries = 0;
    let expenseEntries = 0;

    entries.forEach(entry => {
      const isFixed = !!entry.recurrenceId;
      const isPaid = !!entry.payment;
      const entryType = entry.category?.type;
      if (entryType === 'INCOME') {
        totalIncome += entry.amount;
        incomeEntries += 1;
        if (isFixed) {
          fixedIncome += entry.amount;
        } else {
          dynamicIncome += entry.amount;
        }
        return;
      }
      if (entryType === 'EXPENSE') {
        expenseEntries += 1;
        if (isPaid) {
          totalPaidExpenses += entry.amount;
          if (isFixed) {
            fixedPaidExpenses += entry.amount;
          } else {
            dynamicPaidExpenses += entry.amount;
          }
        } else if (isFixed) {
          fixedUnpaidExpenses += entry.amount;
        } else {
          dynamicUnpaidExpenses += entry.amount;
        }
      }
    });

    return {
      totalIncome,
      totalExpenses: totalPaidExpenses,
      totalPaidExpenses,
      totalUnpaidExpenses,
      fixedIncome,
      dynamicIncome,
      fixedExpenses: fixedPaidExpenses,
      dynamicExpenses: dynamicPaidExpenses,
      fixedPaidExpenses,
      fixedUnpaidExpenses,
      dynamicPaidExpenses,
      dynamicUnpaidExpenses,
      totalEntries: entries.length,
      incomeEntries,
      expenseEntries,
    };
  }

  async getCategorySummaryForMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<CategorySummaryResult> {
    const entries = await this.findByUserIdAndMonth(userId, year, month);
    const grouped = new Map<string, CategorySummaryItem>();
    entries.forEach(entry => {
      if (!entry.categoryId || !entry.category) {
        return;
      }
      const type = entry.category.type;
      const key = `${entry.categoryId}:${type}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          categoryId: entry.categoryId,
          categoryName: entry.category.name,
          type,
          total: 0,
          count: 0,
          unpaidAmount: 0,
        });
      }
      const item = grouped.get(key)!;
      item.count += 1;
      if (type === 'INCOME') {
        item.total += entry.amount;
      } else if (entry.payment) {
        item.total += entry.amount;
      } else {
        item.unpaidAmount += entry.amount;
      }
    });

    const allItems = [...grouped.values()].sort((a, b) => b.total - a.total);
    return {
      items: allItems.slice(0, 3),
      allItems,
      incomeTotal: allItems.filter(item => item.type === 'INCOME').length,
      expenseTotal: allItems.filter(item => item.type === 'EXPENSE').length,
    };
  }

  async getFixedEntriesSummary(userId: string): Promise<FixedEntriesSummary> {
    const entries = await this.findByUserId(userId);
    const fixed = entries.filter(entry => !!entry.recurrenceId);
    const fixedIncome = fixed
      .filter(entry => entry.category?.type === 'INCOME')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const fixedExpenses = fixed
      .filter(entry => entry.category?.type === 'EXPENSE' && !!entry.payment)
      .reduce((sum, entry) => sum + entry.amount, 0);
    return {
      fixedIncome,
      fixedExpenses,
      fixedNetFlow: fixedIncome - fixedExpenses,
      entriesCount: fixed.length,
    };
  }

  async getCurrentBalance(userId: string): Promise<number> {
    const entries = await this.findByUserId(userId);
    const totalIncome = entries
      .filter(entry => entry.category?.type === 'INCOME')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const totalExpenses = entries
      .filter(entry => entry.category?.type === 'EXPENSE' && !!entry.payment)
      .reduce((sum, entry) => sum + entry.amount, 0);
    return totalIncome - totalExpenses;
  }

  async getDistinctMonthsYears(userId: string): Promise<MonthYear[]> {
    const result = await this.entryRepository
      .createQueryBuilder('entry')
      .select('EXTRACT(YEAR FROM entry.dueDate)', 'year')
      .addSelect('EXTRACT(MONTH FROM entry.dueDate)', 'month')
      .where('entry.userId = :userId', { userId })
      .groupBy('EXTRACT(YEAR FROM entry.dueDate)')
      .addGroupBy('EXTRACT(MONTH FROM entry.dueDate)')
      .orderBy('EXTRACT(YEAR FROM entry.dueDate)', 'DESC')
      .addOrderBy('EXTRACT(MONTH FROM entry.dueDate)', 'DESC')
      .getRawMany();

    return result.map(row => ({
      year: parseInt(row.year, 10),
      month: parseInt(row.month, 10),
    }));
  }

  async getAccumulatedStats(
    userId: string,
    year: number,
    month: number,
  ): Promise<AccumulatedStats> {
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const startOfMonth = new Date(year, month - 1, 1);
    const entries = await this.findByUserId(userId);
    const accumulated = entries.filter(entry => entry.dueDate <= endDate);
    const totalAccumulatedIncome = accumulated
      .filter(entry => entry.category?.type === 'INCOME')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const totalAccumulatedPaidExpenses = accumulated
      .filter(entry => entry.category?.type === 'EXPENSE' && !!entry.payment)
      .reduce((sum, entry) => sum + entry.amount, 0);
    const previousMonthsUnpaidExpenses = entries
      .filter(
        entry =>
          entry.category?.type === 'EXPENSE' &&
          !entry.payment &&
          entry.dueDate < startOfMonth,
      )
      .reduce((sum, entry) => sum + entry.amount, 0);
    return {
      totalAccumulatedIncome,
      totalAccumulatedPaidExpenses,
      previousMonthsUnpaidExpenses,
      accumulatedBalance: totalAccumulatedIncome - totalAccumulatedPaidExpenses,
    };
  }

  async update(id: string, data: UpdateEntryData): Promise<EntryModel> {
    await this.entryRepository.update(id, data);
    const updated = await this.entryRepository.findOne({
      where: { id },
      relations: ['category', 'recurrence', 'payment'],
    });
    if (!updated) {
      throw new Error('Entry not found');
    }
    return this.mapToModel(updated);
  }

  async togglePaymentStatus(
    userId: string,
    entryId: string,
    isPaid: boolean,
  ): Promise<ToggleEntryPaymentStatusResult> {
    const entry = await this.entryRepository.findOne({
      where: { id: entryId },
      relations: ['payment'],
    });

    if (!entry) {
      throw new Error('Entry not found');
    }

    if (entry.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (isPaid) {
      if (entry.payment) {
        return {
          entryId,
          isPaid: true,
          paidAt: entry.payment.createdAt,
        };
      }

      const payment = this.paymentRepository.create({
        entryId,
        amount: entry.amount,
      });
      const savedPayment = await this.paymentRepository.save(payment);
      return {
        entryId,
        isPaid: true,
        paidAt: savedPayment.createdAt,
      };
    }

    if (entry.payment) {
      await this.paymentRepository.delete({ entryId });
    }

    return {
      entryId,
      isPaid: false,
      paidAt: null,
    };
  }

  async delete(id: string): Promise<void> {
    const result = await this.entryRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Entry not found');
    }
  }

  async softDelete(id: string): Promise<Date> {
    const deletedAt = new Date();
    await this.delete(id);
    this.logger.logBusinessEvent({
      event: 'entry_deleted',
      entityId: id,
      deletedAt: deletedAt.toISOString(),
    });
    this.metrics.recordTransaction('delete', 'success');
    return deletedAt;
  }

  private mapToModel(entity: EntryEntity): EntryModel {
    return {
      id: entity.id,
      recurrenceId: entity.recurrenceId,
      userId: entity.userId,
      categoryId: entity.categoryId,
      description: entity.description,
      amount: Number(entity.amount),
      issueDate: entity.issueDate,
      dueDate: entity.dueDate,
      recurrence: entity.recurrence
        ? {
            id: entity.recurrence.id,
            type: entity.recurrence.type,
            createdAt: entity.recurrence.createdAt,
          }
        : null,
      payment: entity.payment
        ? {
            id: entity.payment.id,
            entryId: entity.payment.entryId,
            amount: Number(entity.payment.amount),
            createdAt: entity.payment.createdAt,
          }
        : null,
      isPaid: !!entity.payment,
      entryType: entity.category?.type,
      category: entity.category
        ? {
            id: entity.category.id,
            name: entity.category.name,
            description: entity.category.description,
            icon: entity.category.icon,
            color: entity.category.color,
            type: entity.category.type,
            createdAt: entity.category.createdAt,
            updatedAt: entity.category.updatedAt,
          }
        : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      categoryName: entity.category?.name ?? null,
    };
  }
}
