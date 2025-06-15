import { AddEntryUseCase } from '@domain/usecases/add-entry.usecase';
import { EntryModel } from '@domain/models/entry.model';
import { MockEntryFactory } from '../models/entry.mock';

/**
 * Factory for creating AddEntry use case mocks with different scenarios
 */
export class AddEntryUseCaseMockFactory {
  static createSuccess(
    entry: EntryModel = MockEntryFactory.create(),
  ): jest.Mocked<AddEntryUseCase> {
    return {
      execute: jest.fn().mockResolvedValue(entry),
    };
  }

  static createFailure(error: Error): jest.Mocked<AddEntryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(error),
    };
  }

  static createValidationFailure(): jest.Mocked<AddEntryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(new Error('Validation failed')),
    };
  }

  static createUserNotFoundFailure(): jest.Mocked<AddEntryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(new Error('User not found')),
    };
  }

  static createCategoryNotFoundFailure(): jest.Mocked<AddEntryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(new Error('Category not found')),
    };
  }
}
