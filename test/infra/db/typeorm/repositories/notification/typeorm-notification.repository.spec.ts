import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormNotificationRepository } from '@infra/db/typeorm/repositories/typeorm-notification.repository';
import { NotificationEntity } from '@infra/db/typeorm/entities/notification.entity';
import { NotificationStatus } from '@domain/models/notification.model';
import { LoggerSpy } from '@test/infra/mocks/logging/logger.spy';
import { MetricsSpy } from '@test/infra/mocks/metrics/metrics.spy';

describe('TypeormNotificationRepository', () => {
  let repository: TypeormNotificationRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<NotificationEntity>>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  beforeEach(async () => {
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    testingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TypeormNotificationRepository,
          useFactory: () => {
            return new TypeormNotificationRepository(
              mockRepository,
              loggerSpy,
              metricsSpy,
            );
          },
        },
      ],
    }).compile();

    repository = testingModule.get<TypeormNotificationRepository>(
      TypeormNotificationRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerSpy.clear();
    metricsSpy.clear();
  });

  afterAll(async () => {
    await testingModule.close();
  });

  describe('create', () => {
    it('should create notification successfully', async () => {
      // Arrange
      const createData = {
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        jobId: null,
      };

      const mockEntity: NotificationEntity = {
        id: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        jobId: null,
        status: NotificationStatus.PENDING,
        sentAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deletedAt: null,
        entry: null,
        user: null,
      };

      mockRepository.create.mockReturnValue(mockEntity);
      mockRepository.save.mockResolvedValue(mockEntity);

      // Act
      const result = await repository.create(createData);

      // Assert
      expect(result.id).toBe('notification-123');
      expect(result.entryId).toBe('entry-123');
      expect(result.userId).toBe('user-123');
      expect(result.status).toBe(NotificationStatus.PENDING);
      expect(mockRepository.create).toHaveBeenCalledWith({
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: createData.scheduledAt,
        jobId: null,
        status: NotificationStatus.PENDING,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockEntity);
      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics).toContainEqual(
        expect.objectContaining({
          labels: { type: 'notification_create', status: 'success' },
        }),
      );
    });

    it('should handle creation errors', async () => {
      // Arrange
      const createData = {
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        jobId: null,
      };

      const error = new Error('Database connection failed');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.create(createData)).rejects.toThrow(
        'Database connection failed',
      );
      expect(
        metricsSpy.hasRecordedApiError(
          'notification_create',
          'Database connection failed',
        ),
      ).toBe(true);
    });
  });

  describe('findById', () => {
    it('should find notification by id successfully', async () => {
      // Arrange
      const mockEntity: NotificationEntity = {
        id: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        jobId: 'job-123',
        status: NotificationStatus.PENDING,
        sentAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deletedAt: null,
        entry: null,
        user: null,
      };

      mockRepository.findOne.mockResolvedValue(mockEntity);

      // Act
      const result = await repository.findById('notification-123');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe('notification-123');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'notification-123' },
        relations: ['entry', 'user'],
      });
    });

    it('should return null when notification not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEntryId', () => {
    it('should find notification by entry id successfully', async () => {
      // Arrange
      const mockEntity: NotificationEntity = {
        id: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        jobId: 'job-123',
        status: NotificationStatus.PENDING,
        sentAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deletedAt: null,
        entry: null,
        user: null,
      };

      mockRepository.findOne.mockResolvedValue(mockEntity);

      // Act
      const result = await repository.findByEntryId('entry-123');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.entryId).toBe('entry-123');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { entryId: 'entry-123' },
        relations: ['entry', 'user'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return null when notification not found by entry id', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByEntryId('non-existent-entry');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update notification status successfully', async () => {
      // Arrange
      const mockEntity: NotificationEntity = {
        id: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        jobId: 'job-123',
        status: NotificationStatus.SENT,
        sentAt: new Date('2024-01-15T10:00:00Z'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deletedAt: null,
        entry: null,
        user: null,
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(mockEntity);

      // Act
      const result = await repository.updateStatus(
        'notification-123',
        NotificationStatus.SENT,
        new Date('2024-01-15T10:00:00Z'),
      );

      // Assert
      expect(result.status).toBe(NotificationStatus.SENT);
      expect(mockRepository.update).toHaveBeenCalledWith('notification-123', {
        status: NotificationStatus.SENT,
        sentAt: new Date('2024-01-15T10:00:00Z'),
      });
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics).toContainEqual(
        expect.objectContaining({
          labels: { type: 'notification_update_status', status: 'success' },
        }),
      );
    });

    it('should throw error when notification not found after update', async () => {
      // Arrange
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        repository.updateStatus('notification-123', NotificationStatus.SENT),
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('updateJobId', () => {
    it('should update notification job id successfully', async () => {
      // Arrange
      const mockEntity: NotificationEntity = {
        id: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        jobId: 'job-456',
        status: NotificationStatus.PENDING,
        sentAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deletedAt: null,
        entry: null,
        user: null,
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(mockEntity);

      // Act
      const result = await repository.updateJobId(
        'notification-123',
        'job-456',
      );

      // Assert
      expect(result.jobId).toBe('job-456');
      expect(mockRepository.update).toHaveBeenCalledWith('notification-123', {
        jobId: 'job-456',
      });
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics).toContainEqual(
        expect.objectContaining({
          labels: { type: 'notification_update_job_id', status: 'success' },
        }),
      );
    });
  });

  describe('cancelByEntryId', () => {
    it('should cancel notifications by entry id successfully', async () => {
      // Arrange
      mockRepository.update.mockResolvedValue({ affected: 2 } as any);

      // Act
      await repository.cancelByEntryId('entry-123');

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(
        { entryId: 'entry-123', status: NotificationStatus.PENDING },
        { status: NotificationStatus.CANCELLED },
      );
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics).toContainEqual(
        expect.objectContaining({
          labels: { type: 'notification_cancel_by_entry', status: 'success' },
        }),
      );
    });
  });

  describe('deleteCancelledOlderThan', () => {
    it('should delete cancelled notifications older than specified days', async () => {
      // Arrange
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // Act
      const result = await repository.deleteCancelledOlderThan(30);

      // Assert
      expect(result).toBe(5);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(NotificationEntity);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('status = :status', {
        status: NotificationStatus.CANCELLED,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics).toContainEqual(
        expect.objectContaining({
          labels: { type: 'notification_cleanup', status: 'success' },
        }),
      );
    });
  });

  describe('delete', () => {
    it('should delete notification successfully', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      // Act
      await repository.delete('notification-123');

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith('notification-123');
    });
  });
});
