import {
  UpdateEntryRequest,
  UpdateEntryUseCase,
} from '@domain/usecases/update-entry.usecase';
import { EntryModel } from '@domain/models/entry.model';
import { EntryRepository } from '../protocols/repositories/entry-repository';
import { UserRepository } from '../protocols/repositories/user-repository';
import { CategoryRepository } from '../protocols/repositories/category-repository';
import { CreateNotificationUseCase } from '@domain/usecases/create-notification.usecase';
import { CancelNotificationUseCase } from '@domain/usecases/cancel-notification.usecase';

export class DbUpdateEntryUseCase implements UpdateEntryUseCase {
  constructor(
    private readonly entryRepository: EntryRepository,
    private readonly userRepository: UserRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly createNotificationUseCase?: CreateNotificationUseCase,
    private readonly cancelNotificationUseCase?: CancelNotificationUseCase,
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

    // Check if date changed (for notification update)
    const dateChanged =
      existingEntry.date.getTime() !== new Date(request.date).getTime();

    // Update entry
    const updatedEntry = await this.entryRepository.update(request.id, {
      description: request.description.trim(),
      amount: request.amount,
      date: request.date,
      type: request.type,
      isFixed: request.isFixed,
      categoryId: request.categoryId,
    });

    // Handle notifications for EXPENSE entries
    if (updatedEntry.type === 'EXPENSE' && user.notificationEnabled !== false) {
      // Cancel old notification if date changed
      if (dateChanged && this.cancelNotificationUseCase) {
        try {
          await this.cancelNotificationUseCase.execute({
            entryId: updatedEntry.id,
          });
        } catch (error) {
          console.error('Failed to cancel notification:', error);
        }
      }

      // Create new notification (if date changed or didn't exist before)
      if (dateChanged && this.createNotificationUseCase) {
        try {
          await this.createNotificationUseCase.execute({
            entryId: updatedEntry.id,
            userId: updatedEntry.userId,
            entry: updatedEntry,
            user,
          });
        } catch (error) {
          console.error('Failed to create notification:', error);
        }
      }
    }

    return updatedEntry;
  }
}
