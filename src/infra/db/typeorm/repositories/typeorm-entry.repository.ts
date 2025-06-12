import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  EntryRepository,
  CreateEntryData,
} from "@data/protocols/entry-repository";
import { EntryModel } from "@domain/models/entry.model";
import { EntryEntity } from "../entities/entry.entity";

@Injectable()
export class TypeormEntryRepository implements EntryRepository {
  constructor(
    @InjectRepository(EntryEntity)
    private readonly entryRepository: Repository<EntryEntity>
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
      relations: ["user", "category"],
    });
    return entry ? this.mapToModel(entry) : null;
  }

  async findByUserId(userId: string): Promise<EntryModel[]> {
    const entries = await this.entryRepository.find({
      where: { userId },
      relations: ["user", "category"],
      order: { date: "DESC" },
    });
    return entries.map(this.mapToModel);
  }

  async findByUserIdAndMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<EntryModel[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const entries = await this.entryRepository
      .createQueryBuilder("entry")
      .where("entry.userId = :userId", { userId })
      .andWhere("entry.date >= :startDate", { startDate })
      .andWhere("entry.date <= :endDate", { endDate })
      .leftJoinAndSelect("entry.user", "user")
      .leftJoinAndSelect("entry.category", "category")
      .orderBy("entry.date", "DESC")
      .getMany();

    return entries.map(this.mapToModel);
  }

  async update(
    id: string,
    data: Partial<CreateEntryData>
  ): Promise<EntryModel> {
    const updateData: any = {};
    if (data.userId) updateData.userId = data.userId;
    if (data.description) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.date) updateData.date = data.date;
    if (data.type) updateData.type = data.type;
    if (data.isFixed !== undefined) updateData.isFixed = data.isFixed;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

    await this.entryRepository.update(id, updateData);
    const updatedEntry = await this.entryRepository.findOne({
      where: { id },
      relations: ["user", "category"],
    });
    if (!updatedEntry) {
      throw new Error("Entry not found");
    }
    return this.mapToModel(updatedEntry);
  }

  async delete(id: string): Promise<void> {
    const result = await this.entryRepository.delete(id);
    if (result.affected === 0) {
      throw new Error("Entry not found");
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
    };
  }
}
