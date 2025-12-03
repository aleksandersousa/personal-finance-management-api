import {
  DeleteEntryRequest,
  DeleteEntryResponse,
  DeleteEntryUseCase,
} from '@domain/usecases/delete-entry.usecase';
import { EntryRepository } from '../protocols/repositories/entry-repository';

export class DbDeleteEntryUseCase implements DeleteEntryUseCase {
  constructor(private readonly entryRepository: EntryRepository) {}

  async execute(request: DeleteEntryRequest): Promise<DeleteEntryResponse> {
    // Validate input
    if (!request.entryId || request.entryId.trim().length === 0) {
      throw new Error('Entry ID is required');
    }

    if (!request.userId || request.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    // Check if entry exists
    const entry = await this.entryRepository.findById(request.entryId);
    if (!entry) {
      throw new Error('Entry not found');
    }

    // Check if entry is already deleted
    if (entry.deletedAt) {
      throw new Error('Entry is already deleted');
    }

    // Verify ownership
    if (entry.userId !== request.userId) {
      throw new Error('User does not own this entry');
    }

    // Perform soft delete
    const deletedAt = await this.entryRepository.softDelete(request.entryId);

    return {
      deletedAt,
    };
  }
}
