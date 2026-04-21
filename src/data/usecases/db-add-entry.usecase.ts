import {
  AddEntryRequest,
  AddEntryUseCase,
} from '@domain/usecases/add-entry.usecase';
import { EntryModel } from '@domain/models/entry.model';
import { EntryRepository } from '../protocols/repositories/entry-repository';
import { UserRepository } from '../protocols/repositories/user-repository';
import { CategoryRepository } from '../protocols/repositories/category-repository';
import { CreateNotificationUseCase } from '@domain/usecases/create-notification.usecase';

export class DbAddEntryUseCase implements AddEntryUseCase {
  constructor(
    private readonly entryRepository: EntryRepository,
    private readonly userRepository: UserRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly createNotificationUseCase?: CreateNotificationUseCase,
  ) {}

  async execute(request: AddEntryRequest): Promise<EntryModel> {
    // Validate amount
    if (request.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    // Validate description
    if (!request.description || request.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    const issueDate = new Date(request.issueDate);
    issueDate.setHours(0, 0, 0, 0);
    const dueDate = new Date(request.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate.getTime() < issueDate.getTime()) {
      throw new Error('Due date cannot be before issue date');
    }

    // Validate user ID
    if (!request.userId) {
      throw new Error('User ID is required');
    }

    // Verify user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify category exists and belongs to user (if provided)
    let categoryType: 'INCOME' | 'EXPENSE' | null = null;
    if (request.categoryId) {
      const category = await this.categoryRepository.findById(
        request.categoryId,
      );
      if (!category) {
        throw new Error('Category not found');
      }
      categoryType = category.type;
      const linked = await this.categoryRepository.isUserLinkedToCategory(
        request.userId,
        request.categoryId,
      );
      if (!linked) {
        throw new Error('Category does not belong to the user');
      }
    }

    // Create entry
    const entry = await this.entryRepository.create({
      userId: request.userId,
      description: request.description.trim(),
      amount: request.amount,
      issueDate: request.issueDate,
      dueDate: request.dueDate,
      recurrenceId: request.recurrenceId ?? null,
      categoryId: request.categoryId,
    });

    // Create notification for EXPENSE entries if user has notifications enabled
    if (
      categoryType === 'EXPENSE' &&
      this.createNotificationUseCase &&
      user.notificationEnabled !== false
    ) {
      try {
        await this.createNotificationUseCase.execute({
          entryId: entry.id,
          userId: entry.userId,
          entry,
          user,
        });
      } catch (error) {
        // Log error but don't fail entry creation if notification fails
        console.error('Failed to create notification for entry:', error);
      }
    }

    return entry;
  }
}
