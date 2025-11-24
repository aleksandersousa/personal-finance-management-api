import { Test, TestingModule } from '@nestjs/testing';
import { EntryController } from '@presentation/controllers/entry.controller';
import { LoggerSpy } from '../../../infra/mocks/logging/logger.spy';
import { MetricsSpy } from '../../../infra/mocks/metrics/metrics.spy';

describe('EntryController - Main', () => {
  let controller: EntryController;

  beforeEach(async () => {
    const loggerSpy = new LoggerSpy();
    const metricsSpy = new MetricsSpy();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntryController],
      providers: [
        { provide: 'AddEntryUseCase', useValue: {} },
        { provide: 'ListEntriesByMonthUseCase', useValue: {} },
        { provide: 'DeleteEntryUseCase', useValue: {} },
        { provide: 'UpdateEntryUseCase', useValue: {} },
        { provide: 'GetEntriesMonthsYearsUseCase', useValue: {} },
        { provide: 'Logger', useValue: loggerSpy },
        { provide: 'Metrics', useValue: metricsSpy },
      ],
    }).compile();

    controller = module.get<EntryController>(EntryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
