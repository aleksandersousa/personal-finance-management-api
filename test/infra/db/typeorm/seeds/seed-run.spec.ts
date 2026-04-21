describe('seed-run', () => {
  const initializeMock = jest.fn();
  const destroyMock = jest.fn();
  const seedRecurrencesMock = jest.fn();
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  const originalExit = process.exit;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.exit = jest.fn() as any;
  });

  afterAll(() => {
    process.exit = originalExit;
    errorSpy.mockRestore();
  });

  it('runs seeds and destroys datasource on success', async () => {
    initializeMock.mockResolvedValue(undefined);
    destroyMock.mockResolvedValue(undefined);
    seedRecurrencesMock.mockResolvedValue(undefined);

    jest.doMock('@infra/db/typeorm/config/data-source', () => ({
      AppDataSource: {
        initialize: initializeMock,
        destroy: destroyMock,
      },
    }));
    jest.doMock('@infra/db/typeorm/seeds/seed-recurrences', () => ({
      seedRecurrences: seedRecurrencesMock,
    }));

    await import('@infra/db/typeorm/seeds/seed-run');
    await new Promise(resolve => setImmediate(resolve));

    expect(initializeMock).toHaveBeenCalledTimes(1);
    expect(seedRecurrencesMock).toHaveBeenCalledTimes(1);
    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('logs and exits when seed execution fails', async () => {
    const error = new Error('seed failure');
    initializeMock.mockResolvedValue(undefined);
    destroyMock.mockResolvedValue(undefined);
    seedRecurrencesMock.mockRejectedValue(error);

    jest.doMock('@infra/db/typeorm/config/data-source', () => ({
      AppDataSource: {
        initialize: initializeMock,
        destroy: destroyMock,
      },
    }));
    jest.doMock('@infra/db/typeorm/seeds/seed-recurrences', () => ({
      seedRecurrences: seedRecurrencesMock,
    }));

    await import('@infra/db/typeorm/seeds/seed-run');
    await new Promise(resolve => setImmediate(resolve));

    expect(errorSpy).toHaveBeenCalledWith(error);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });
});
