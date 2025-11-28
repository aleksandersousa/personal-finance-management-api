import { Repository } from 'typeorm';
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CategoryRepository,
  FindCategoriesWithFiltersResult,
} from '@data/protocols/category-repository';
import {
  Category,
  CategoryType,
  CategoryCreateData,
  CategoryUpdateData,
  CategoryListFilters,
} from '@domain/models/category.model';
import { CategoryEntity } from '../entities/category.entity';
import type { Logger, Metrics } from '@/data/protocols';

@Injectable()
export class TypeormCategoryRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @Inject('Logger')
    private readonly logger: Logger,
    @Inject('Metrics')
    private readonly metrics: Metrics,
  ) {}

  async create(data: CategoryCreateData): Promise<Category> {
    const startTime = Date.now();

    try {
      const entity = this.categoryRepository.create({
        name: data.name,
        description: data.description,
        type: data.type,
        color: data.color,
        icon: data.icon,
        userId: data.userId,
        isDefault: false,
      });

      const savedCategory = await this.categoryRepository.save(entity);

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'category_created',
        entityId: savedCategory.id,
        userId: data.userId,
        duration,
        metadata: {
          categoryName: data.name,
          categoryType: data.type,
        },
      });

      if (this.metrics) {
        this.metrics.recordTransaction('category_create', 'success');
      }
      return this.mapToModel(savedCategory);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to create category: ${errorMessage}`,
        errorStack,
      );
      if (this.metrics) {
        this.metrics.recordApiError('category_repository_create', errorMessage);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Category | null> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id },
      });

      if (this.metrics) {
        this.metrics.recordTransaction('category_find_by_id', 'success');
      }
      return category ? this.mapToModel(category) : null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to find category by id: ${errorMessage}`,
        errorStack,
      );
      if (this.metrics) {
        this.metrics.recordApiError(
          'category_repository_find_by_id',
          errorMessage,
        );
      }
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Category[]> {
    try {
      const categories = await this.categoryRepository.find({
        where: { userId },
        order: { name: 'ASC' },
      });

      if (this.metrics) {
        this.metrics.recordTransaction('category_find_by_user_id', 'success');
      }
      return categories.map(this.mapToModel);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to find categories by userId: ${errorMessage}`,
        errorStack,
      );
      if (this.metrics) {
        this.metrics.recordApiError(
          'category_repository_find_by_user_id',
          errorMessage,
        );
      }
      throw error;
    }
  }

  async findByUserIdAndType(
    userId: string,
    type: CategoryType,
  ): Promise<Category[]> {
    try {
      const categories = await this.categoryRepository.find({
        where: { userId, type },
        order: { name: 'ASC' },
      });

      if (this.metrics) {
        this.metrics.recordTransaction(
          'category_find_by_user_id_and_type',
          'success',
        );
      }
      return categories.map(this.mapToModel);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to find categories by userId and type: ${errorMessage}`,
        errorStack,
      );
      if (this.metrics) {
        this.metrics.recordApiError(
          'category_repository_find_by_user_id_and_type',
          errorMessage,
        );
      }
      throw error;
    }
  }

  async findByUserIdAndName(
    userId: string,
    name: string,
  ): Promise<Category | null> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { userId, name },
      });

      if (this.metrics) {
        this.metrics.recordTransaction(
          'category_find_by_user_id_and_name',
          'success',
        );
      }
      return category ? this.mapToModel(category) : null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to find category by userId and name: ${errorMessage}`,
        errorStack,
      );
      if (this.metrics) {
        this.metrics.recordApiError(
          'category_repository_find_by_user_id_and_name',
          errorMessage,
        );
      }
      throw error;
    }
  }

  async findWithFilters(
    filters: CategoryListFilters,
  ): Promise<FindCategoriesWithFiltersResult> {
    const startTime = Date.now();

    try {
      const queryBuilder = this.categoryRepository
        .createQueryBuilder('category')
        .where('category.userId = :userId', { userId: filters.userId });

      if (filters.type && filters.type !== 'all') {
        queryBuilder.andWhere('category.type = :type', { type: filters.type });
      }

      if (filters.search && filters.search.trim()) {
        queryBuilder.andWhere('category.name ILIKE :search', {
          search: `%${filters.search.trim()}%`,
        });
      }

      if (filters.includeStats) {
        queryBuilder
          .leftJoin('category.entries', 'entry')
          .addSelect('COUNT(entry.id)', 'entriesCount')
          .addSelect('COALESCE(SUM(entry.amount), 0)', 'totalAmount')
          .addSelect('MAX(entry.date)', 'lastUsed')
          .groupBy('category.id');
      }

      queryBuilder.orderBy('category.name', 'ASC');

      let total: number;
      if (filters.includeStats) {
        const countQuery = this.categoryRepository
          .createQueryBuilder('category')
          .where('category.userId = :userId', { userId: filters.userId });

        if (filters.type && filters.type !== 'all') {
          countQuery.andWhere('category.type = :type', { type: filters.type });
        }

        if (filters.search && filters.search.trim()) {
          countQuery.andWhere('category.name ILIKE :search', {
            search: `%${filters.search.trim()}%`,
          });
        }

        total = await countQuery.getCount();
      } else {
        total = await queryBuilder.getCount();
      }

      // Apply pagination if provided
      if (filters.page !== undefined && filters.limit !== undefined) {
        const skip = (filters.page - 1) * filters.limit;
        queryBuilder.skip(skip).take(filters.limit);
      }

      const categories = await queryBuilder.getRawAndEntities();

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'categories_found_with_filters',
        userId: filters.userId,
        duration,
        metadata: {
          type: filters.type,
          includeStats: filters.includeStats,
          resultCount: categories.entities.length,
          total,
          page: filters.page,
          limit: filters.limit,
        },
      });

      if (this.metrics) {
        this.metrics.recordTransaction('category_find_with_filters', 'success');
      }

      const mappedCategories = categories.entities.map((category, index) => {
        const mapped = this.mapToModel(category);
        if (filters.includeStats) {
          const raw = categories.raw[index];
          return {
            ...mapped,
            entriesCount: parseInt(raw.entriesCount) || 0,
            totalAmount: parseFloat(raw.totalAmount) || 0,
            lastUsed: raw.lastUsed ? new Date(raw.lastUsed) : null,
          };
        }
        return mapped;
      });

      // Ensure we always return an array, even if empty
      const data = Array.isArray(mappedCategories) ? mappedCategories : [];

      return {
        data,
        total: total || 0,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to find categories with filters: ${errorMessage}`,
        errorStack,
      );
      if (this.metrics) {
        this.metrics.recordApiError(
          'category_repository_find_with_filters',
          errorMessage,
        );
      }
      throw error;
    }
  }

  async update(id: string, data: CategoryUpdateData): Promise<Category> {
    const startTime = Date.now();

    try {
      const updateData: Partial<CategoryEntity> = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      if (data.color !== undefined) {
        updateData.color = data.color;
      }
      if (data.icon !== undefined) {
        updateData.icon = data.icon;
      }

      const result = await this.categoryRepository.update(id, updateData);

      if (result.affected === 0) {
        throw new Error('Category not found');
      }

      const updatedCategory = await this.categoryRepository.findOne({
        where: { id },
      });

      if (!updatedCategory) {
        throw new Error('Category not found after update');
      }

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'category_updated',
        entityId: id,
        userId: updatedCategory.userId,
        duration,
        metadata: {
          updatedFields: Object.keys(data),
        },
      });

      if (this.metrics) {
        this.metrics.recordTransaction('category_update', 'success');
      }
      return this.mapToModel(updatedCategory);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to update category: ${errorMessage}`,
        errorStack,
      );
      if (this.metrics) {
        this.metrics.recordApiError('category_repository_update', errorMessage);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const startTime = Date.now();

    try {
      const category = await this.categoryRepository.findOne({ where: { id } });

      if (!category) {
        throw new Error('Category not found');
      }

      const result = await this.categoryRepository.delete(id);

      if (result.affected === 0) {
        throw new Error('Category not found');
      }

      const duration = Date.now() - startTime;

      this.logger.logBusinessEvent({
        event: 'category_deleted',
        entityId: id,
        userId: category.userId,
        duration,
        metadata: {
          categoryName: category.name,
        },
      });

      if (this.metrics) {
        this.metrics.recordTransaction('category_delete', 'success');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to delete category: ${errorMessage}`,
        errorStack,
      );
      if (this.metrics) {
        this.metrics.recordApiError('category_repository_delete', errorMessage);
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      const result = await this.categoryRepository.softDelete(id);

      if (result.affected === 0) {
        throw new Error('Category not found');
      }

      this.logger.logBusinessEvent({
        event: 'category_soft_deleted',
        entityId: id,
      });

      if (this.metrics) {
        this.metrics.recordTransaction('category_soft_delete', 'success');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to soft delete category: ${errorMessage}`,
        errorStack,
      );
      if (this.metrics) {
        this.metrics.recordApiError(
          'category_repository_soft_delete',
          errorMessage,
        );
      }
      throw error;
    }
  }

  async hasEntriesAssociated(categoryId: string): Promise<boolean> {
    try {
      const count = await this.categoryRepository
        .createQueryBuilder('category')
        .leftJoin('category.entries', 'entry')
        .where('category.id = :categoryId', { categoryId })
        .andWhere('entry.id IS NOT NULL')
        .getCount();

      if (this.metrics) {
        this.metrics.recordTransaction(
          'category_has_entries_associated',
          'success',
        );
      }
      return count > 0;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to check entries association: ${errorMessage}`,
        errorStack,
      );
      if (this.metrics) {
        this.metrics.recordApiError(
          'category_repository_has_entries_associated',
          errorMessage,
        );
      }
      throw error;
    }
  }

  private mapToModel(entity: CategoryEntity): Category {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      type: entity.type,
      color: entity.color,
      icon: entity.icon,
      userId: entity.userId,
      isDefault: entity.isDefault,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
