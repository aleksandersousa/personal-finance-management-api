import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  CategoryRepository,
  CreateCategoryData,
} from "@data/protocols/category-repository";
import { CategoryModel, CategoryType } from "@domain/models/category.model";
import { CategoryEntity } from "../entities/category.entity";

@Injectable()
export class TypeormCategoryRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>
  ) {}

  async create(data: CreateCategoryData): Promise<CategoryModel> {
    const entity = this.categoryRepository.create({
      name: data.name,
      type: data.type,
      userId: data.userId,
    });
    const savedCategory = await this.categoryRepository.save(entity);
    return this.mapToModel(savedCategory);
  }

  async findById(id: string): Promise<CategoryModel | null> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });
    return category ? this.mapToModel(category) : null;
  }

  async findByUserId(userId: string): Promise<CategoryModel[]> {
    const categories = await this.categoryRepository.find({
      where: { userId },
      order: { name: "ASC" },
    });
    return categories.map(this.mapToModel);
  }

  async findByUserIdAndType(
    userId: string,
    type: CategoryType
  ): Promise<CategoryModel[]> {
    const categories = await this.categoryRepository.find({
      where: { userId, type },
      order: { name: "ASC" },
    });
    return categories.map(this.mapToModel);
  }

  async update(
    id: string,
    data: Partial<CreateCategoryData>
  ): Promise<CategoryModel> {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.type) updateData.type = data.type;
    if (data.userId) updateData.userId = data.userId;

    await this.categoryRepository.update(id, updateData);
    const updatedCategory = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!updatedCategory) {
      throw new Error("Category not found");
    }
    return this.mapToModel(updatedCategory);
  }

  async delete(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) {
      throw new Error("Category not found");
    }
  }

  private mapToModel(entity: CategoryEntity): CategoryModel {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      userId: entity.userId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
