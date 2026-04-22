import { Test, TestingModule } from '@nestjs/testing';
import { RecurringEntriesScheduler } from '@infra/queue/schedulers/recurring-entries.scheduler';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RecurringEntriesJobData } from '@domain/contracts';
import { CRON_PATTERNS, QUEUE_NAMES } from '@domain/constants';

describe('RecurringEntriesScheduler', () => {
  let scheduler: RecurringEntriesScheduler;
  let mockQueue: jest.Mocked<Queue<RecurringEntriesJobData>>;
  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringEntriesScheduler,
        {
          provide: getQueueToken(QUEUE_NAMES.RECURRING_ENTRIES),
          useValue: mockQueue,
        },
      ],
    }).compile();

    scheduler = module.get<RecurringEntriesScheduler>(
      RecurringEntriesScheduler,
    );

    loggerLogSpy = jest.spyOn(scheduler['logger'], 'log');
    loggerErrorSpy = jest.spyOn(scheduler['logger'], 'error');
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.IS_WORKER;
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should schedule recurring entries job in development', async () => {
      process.env.NODE_ENV = 'development';
      mockQueue.add.mockResolvedValue({} as any);

      await scheduler.onModuleInit();

      expect(mockQueue.add).toHaveBeenCalledWith(
        'mirror-monthly-recurring-entries',
        {
          runDate: expect.any(String),
        },
        {
          repeat: {
            pattern: CRON_PATTERNS.EVERY_MONTH_ON_DAY_1_AT_1AM,
          },
          jobId: 'monthly-recurring-entries',
        },
      );
      expect(loggerLogSpy).toHaveBeenCalledWith(
        `Recurring entries job scheduled with pattern: ${CRON_PATTERNS.EVERY_MONTH_ON_DAY_1_AT_1AM}`,
      );
    });

    it('should skip scheduling in production without IS_WORKER', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.IS_WORKER;

      await scheduler.onModuleInit();

      expect(mockQueue.add).not.toHaveBeenCalled();
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Skipping recurring entries scheduling - not a worker process. Set IS_WORKER=true to enable.',
      );
    });

    it('should handle already exists error gracefully', async () => {
      process.env.NODE_ENV = 'development';
      mockQueue.add.mockRejectedValue(new Error('Job already exists'));

      await scheduler.onModuleInit();

      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Recurring entries recurring job already exists',
      );
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });
  });
});
