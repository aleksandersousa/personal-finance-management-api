import { UpdateEntryUseCase } from '@domain/usecases/update-entry.usecase';
import { EntryModel } from '@domain/models/entry.model';
import { mockEntry } from '../models/entry.mock';

export class UpdateEntryUseCaseMockFactory {
  static createSuccess(
    result: EntryModel = mockEntry,
  ): jest.Mocked<UpdateEntryUseCase> {
    return {
      execute: jest.fn().mockResolvedValue(result),
    };
  }

  static createFailure(error: Error): jest.Mocked<UpdateEntryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(error),
    };
  }

  static createValidationFailure(): jest.Mocked<UpdateEntryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(new Error('Validation failed')),
    };
  }

  static createNotFoundFailure(): jest.Mocked<UpdateEntryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(new Error('Entry not found')),
    };
  }

  static createUnauthorizedFailure(): jest.Mocked<UpdateEntryUseCase> {
    return {
      execute: jest
        .fn()
        .mockRejectedValue(new Error('You can only update your own entries')),
    };
  }
}
