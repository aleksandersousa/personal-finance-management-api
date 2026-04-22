import { Test, TestingModule } from '@nestjs/testing';
import { RecurringEntriesProcessor } from '@infra/queue/processors/recurring-entries.processor';
import { ScheduledTasksWorker } from '@workers/scheduled-tasks.worker';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { Job } from 'bullmq';
import { RecurringEntriesJobData } from '@domain/contracts';

describe('RecurringEntriesProcessor', () => {
  let processor: RecurringEntriesProcessor;
  let scheduledTasksWorker: jest.Mocked<ScheduledTasksWorker>;
  let logger: jest.Mocked<ContextAwareLoggerService>;

  beforeEach(async () => {
    scheduledTasksWorker = {
      mirrorMonthlyRecurringEntries: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logBusinessEvent: jest.fn(),
      logSecurityEvent: jest.fn(),
      logPerformanceEvent: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringEntriesProcessor,
        {
          provide: ScheduledTasksWorker,
          useValue: scheduledTasksWorker,
        },
        {
          provide: ContextAwareLoggerService,
          useValue: logger,
        },
      ],
    }).compile();

    processor = module.get<RecurringEntriesProcessor>(
      RecurringEntriesProcessor,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process recurring entries job successfully', async () => {
      const jobData: RecurringEntriesJobData = {
        runDate: '2026-04-01T00:00:00.000Z',
      };
      const mockJob = {
        id: 'job-1',
        data: jobData,
      } as Job<RecurringEntriesJobData>;

      scheduledTasksWorker.mirrorMonthlyRecurringEntries.mockResolvedValue({
        success: true,
        createdCount: 10,
        skippedCount: 2,
      });

      await processor.process(mockJob);

      expect(
        scheduledTasksWorker.mirrorMonthlyRecurringEntries,
      ).toHaveBeenCalledWith({
        runDate: '2026-04-01T00:00:00.000Z',
      });
      expect(logger.log).toHaveBeenCalledWith(
        'Recurring entries job job-1 completed successfully. Created: 10, skipped: 2',
        'RecurringEntriesProcessor',
      );
    });

    it('should throw error when worker returns failure', async () => {
      const mockJob = {
        id: 'job-2',
        data: { runDate: '2026-04-01T00:00:00.000Z' },
      } as Job<RecurringEntriesJobData>;

      scheduledTasksWorker.mirrorMonthlyRecurringEntries.mockResolvedValue({
        success: false,
        createdCount: 0,
        skippedCount: 0,
        error: 'mirror failed',
      });

      await expect(processor.process(mockJob)).rejects.toThrow('mirror failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Error processing recurring entries job job-2: mirror failed',
        expect.any(String),
        'RecurringEntriesProcessor',
      );
    });
  });
});
