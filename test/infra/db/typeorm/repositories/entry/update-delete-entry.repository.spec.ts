import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository - Update & Delete', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockLogger: jest.Mocked<ContextAwareLoggerService>;
  let mockMetrics: jest.Mocked<FinancialMetricsService>;

  const mockEntryEntity: EntryEntity = {
    id: 'entry-1',
    userId: 'user-123',
    description: 'Test Entry',
    amount: 1000,
    date: new Date('2024-01-15'),
    type: 'INCOME',
    isFixed: false,
    categoryId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as EntryEntity;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logBusinessEvent: jest.fn(),
    } as any;

    mockMetrics = {
      recordHttpRequest: jest.fn(),
      recordAuthEvent: jest.fn(),
      recordTransaction: jest.fn(),
      recordApiError: jest.fn(),
      updateActiveUsers: jest.fn(),
      getMetrics: jest.fn(),
    } as any;

    testingModule = await Test.createTestingModule({
      providers: [
        TypeormEntryRepository,
        {
          provide: getRepositoryToken(EntryEntity),
          useValue: mockRepository,
        },
        {
          provide: 'Logger',
          useValue: mockLogger,
        },
        {
          provide: 'Metrics',
          useValue: mockMetrics,
        },
      ],
    }).compile();

    repository = testingModule.get<TypeormEntryRepository>(
      TypeormEntryRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('should update an entry', async () => {
      const updateData = {
        description: 'Updated Entry',
        amount: 2000,
      };

      const updatedEntity = { ...mockEntryEntity, ...updateData };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedEntity);

      const result = await repository.update('entry-1', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith('entry-1', updateData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        relations: ['user', 'category'],
      });
      expect(result.description).toBe('Updated Entry');
      expect(result.amount).toBe(2000);
    });

    it('should throw error when entry not found after update', async () => {
      const updateData = { description: 'Updated Entry' };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(repository.update('entry-1', updateData)).rejects.toThrow(
        'Entry not found',
      );
    });
  });

  describe('delete', () => {
    it('should delete an entry', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.delete('entry-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('entry-1');
    });

    it('should throw error when entry not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(repository.delete('entry-1')).rejects.toThrow(
        'Entry not found',
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete an entry and return deletedAt timestamp', async () => {
      // Create a fixed date to avoid timing issues
      const fixedDate = new Date('2024-01-15T10:00:00.000Z');
      const softDeletedEntity = { ...mockEntryEntity, deletedAt: fixedDate };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(softDeletedEntity);

      // Mock Date constructor to return our fixed date
      const dateSpy = jest
        .spyOn(global, 'Date')
        .mockImplementation(() => fixedDate as any);

      const result = await repository.softDelete('entry-1');

      // Restore original Date constructor
      dateSpy.mockRestore();

      expect(mockRepository.update).toHaveBeenCalledWith('entry-1', {
        deletedAt: fixedDate,
      });
      expect(result).toEqual(fixedDate);
    });

    it('should throw error when entry not found', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 } as any);

      await expect(repository.softDelete('entry-1')).rejects.toThrow(
        'Entry not found',
      );
    });
  });
});
