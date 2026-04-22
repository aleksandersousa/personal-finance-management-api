import { Repository } from 'typeorm';
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CategoryRepository,
  FindCategoriesWithFiltersResult,
} from '@/data/protocols/repositories/category-repository';
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
      const name = data.name.trim();
      let savedCategory = await this.categoryRepository.findOne({
        where: { name },
      });

      if (!savedCategory) {
        savedCategory = await this.categoryRepository.save(
          this.categoryRepository.create({
            name,
            description: data.description,
            type: data.type,
            color: data.color,
            icon: data.icon,
          }),
        );
      }

      const existingLink = await this.categoryRepository
        .createQueryBuilder('category')
        .innerJoin('category.users', 'user', 'user.id = :userId', {
          userId: data.userId,
        })
        .where('category.id = :categoryId', {
          categoryId: savedCategory.id,
        })
        .getCount();
      if (existingLink > 0) {
        throw new Error('Category name already exists for this user');
      }

      await this.categoryRepository
        .createQueryBuilder()
        .relation(CategoryEntity, 'users')
        .of(savedCategory.id)
        .add(data.userId);

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
      const categories = await this.categoryRepository
        .createQueryBuilder('category')
        .innerJoin('category.users', 'user', 'user.id = :userId', { userId })
        .orderBy('category.name', 'ASC')
        .getMany();

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
      const categories = await this.categoryRepository
        .createQueryBuilder('category')
        .innerJoin('category.users', 'user', 'user.id = :userId', { userId })
        .andWhere('category.type = :type', { type })
        .orderBy('category.name', 'ASC')
        .getMany();

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
      const category = await this.categoryRepository
        .createQueryBuilder('category')
        .innerJoin('category.users', 'user', 'user.id = :userId', { userId })
        .andWhere('category.name = :name', { name })
        .getOne();

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
        .innerJoin('category.users', 'user', 'user.id = :userId', {
          userId: filters.userId,
        });

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
          .leftJoin('category.entries', 'entry', 'entry.userId = :userId', {
            userId: filters.userId,
          })
          .addSelect('COUNT(entry.id)', 'entriesCount')
          .addSelect('COALESCE(SUM(entry.amount), 0)', 'totalAmount')
          .addSelect('MAX(entry.dueDate)', 'lastUsed')
          .groupBy('category.id');
      }

      queryBuilder.orderBy('category.name', 'ASC');

      const countQuery = this.categoryRepository
        .createQueryBuilder('category')
        .innerJoin('category.users', 'user', 'user.id = :userId', {
          userId: filters.userId,
        });

      if (filters.type && filters.type !== 'all') {
        countQuery.andWhere('category.type = :type', { type: filters.type });
      }

      if (filters.search && filters.search.trim()) {
        countQuery.andWhere('category.name ILIKE :search', {
          search: `%${filters.search.trim()}%`,
        });
      }

      const total = await countQuery.getCount();

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
      if (data.type !== undefined) {
        updateData.type = data.type;
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

  async isUserLinkedToCategory(
    userId: string,
    categoryId: string,
  ): Promise<boolean> {
    const count = await this.categoryRepository
      .createQueryBuilder('category')
      .innerJoin('category.users', 'user', 'user.id = :userId', { userId })
      .where('category.id = :categoryId', { categoryId })
      .getCount();
    return count > 0;
  }

  async unlinkFromUser(userId: string, categoryId: string): Promise<void> {
    try {
      const linked = await this.isUserLinkedToCategory(userId, categoryId);
      if (!linked) {
        throw new Error('Category not found');
      }

      await this.categoryRepository
        .createQueryBuilder()
        .relation(CategoryEntity, 'users')
        .of(categoryId)
        .remove(userId);

      this.logger.logBusinessEvent({
        event: 'category_unlinked_from_user',
        entityId: categoryId,
        userId,
      });

      if (this.metrics) {
        this.metrics.recordTransaction('category_unlink_from_user', 'success');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to unlink category from user: ${errorMessage}`,
        errorStack,
      );
      if (this.metrics) {
        this.metrics.recordApiError(
          'category_repository_unlink_from_user',
          errorMessage,
        );
      }
      throw error;
    }
  }

  async hasEntriesAssociated(
    userId: string,
    categoryId: string,
  ): Promise<boolean> {
    try {
      const count = await this.categoryRepository
        .createQueryBuilder('category')
        .innerJoin('category.entries', 'entry', 'entry.userId = :userId', {
          userId,
        })
        .where('category.id = :categoryId', { categoryId })
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
      icon: entity.icon,
      color: entity.color,
      type: entity.type,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
