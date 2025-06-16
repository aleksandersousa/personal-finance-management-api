import {
  UpdateEntryRequest,
  UpdateEntryUseCase,
} from '@domain/usecases/update-entry.usecase';
import { EntryModel } from '@domain/models/entry.model';
import { EntryRepository } from '../protocols/entry-repository';
import { UserRepository } from '../protocols/user-repository';
import { CategoryRepository } from '../protocols/category-repository';

export class DbUpdateEntryUseCase implements UpdateEntryUseCase {
  constructor(
    private readonly entryRepository: EntryRepository,
    private readonly userRepository: UserRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(request: UpdateEntryRequest): Promise<EntryModel> {
    // Validate required fields
    if (!request.id) {
      throw new Error('Entry ID is required');
    }

    if (!request.userId) {
      throw new Error('User ID is required');
    }

    // Validate amount
    if (request.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    // Validate description
    if (!request.description || request.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    // Verify user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify entry exists
    const existingEntry = await this.entryRepository.findById(request.id);
    if (!existingEntry) {
      throw new Error('Entry not found');
    }

    // Verify ownership - user can only update their own entries
    if (existingEntry.userId !== request.userId) {
      throw new Error('You can only update your own entries');
    }

    // Verify category exists and belongs to user (if provided)
    if (request.categoryId) {
      const category = await this.categoryRepository.findById(
        request.categoryId,
      );
      if (!category) {
        throw new Error('Category not found');
      }
      if (category.userId !== request.userId) {
        throw new Error('Category does not belong to the user');
      }
    }

    // Update entry
    const updatedEntry = await this.entryRepository.update(request.id, {
      userId: request.userId, // Maintain user ownership
      description: request.description.trim(),
      amount: request.amount,
      date: request.date,
      type: request.type,
      isFixed: request.isFixed,
      categoryId: request.categoryId,
    });

    return updatedEntry;
  }
}
