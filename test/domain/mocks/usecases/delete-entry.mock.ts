import { DeleteEntryUseCase } from '@domain/usecases/delete-entry.usecase';

export class DeleteEntryUseCaseMockFactory {
  static createSuccess(): jest.Mocked<DeleteEntryUseCase> {
    return {
      execute: jest.fn().mockResolvedValue({
        deletedAt: new Date('2025-06-01T15:30:00Z'),
      }),
    };
  }

  static createFailure(error: Error): jest.Mocked<DeleteEntryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(error),
    };
  }

  static createNotFoundFailure(): jest.Mocked<DeleteEntryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(new Error('Entry not found')),
    };
  }

  static createUnauthorizedFailure(): jest.Mocked<DeleteEntryUseCase> {
    return {
      execute: jest
        .fn()
        .mockRejectedValue(new Error('User does not own this entry')),
    };
  }

  static createAlreadyDeletedFailure(): jest.Mocked<DeleteEntryUseCase> {
    return {
      execute: jest
        .fn()
        .mockRejectedValue(new Error('Entry is already deleted')),
    };
  }
}
