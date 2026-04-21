const startMock = jest.fn();
const shutdownMock = jest.fn();
const exporterCtorMock = jest.fn();
const autoInstrumentationMock = jest.fn(() => 'auto-inst');
const resourceCtorMock = jest.fn();

jest.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: jest.fn().mockImplementation(() => ({
    start: startMock,
    shutdown: shutdownMock,
  })),
}));

jest.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: autoInstrumentationMock,
}));

jest.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: jest.fn().mockImplementation((...args) => {
    exporterCtorMock(...args);
    return {};
  }),
}));

jest.mock('@opentelemetry/resources', () => ({
  Resource: jest.fn().mockImplementation((...args) => {
    resourceCtorMock(...args);
    return {};
  }),
}));

describe('opentelemetry tracing', () => {
  const loadModule = async () =>
    import('@infra/tracing/opentelemetry').then(mod => mod);

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.TRACING_ENABLED;
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    delete process.env.OTEL_SERVICE_NAME;
    delete process.env.NODE_ENV;
  });

  it('does not start when tracing is disabled', async () => {
    process.env.TRACING_ENABLED = 'false';
    const tracing = await loadModule();

    await tracing.startTracing();

    expect(startMock).not.toHaveBeenCalled();
  });

  it('starts tracing with configured defaults and shuts down', async () => {
    process.env.TRACING_ENABLED = 'true';
    const tracing = await loadModule();

    await tracing.startTracing();
    await tracing.shutdownTracing();

    expect(exporterCtorMock).toHaveBeenCalledWith({
      url: 'http://tempo:4318/v1/traces',
    });
    expect(resourceCtorMock).toHaveBeenCalled();
    expect(autoInstrumentationMock).toHaveBeenCalled();
    expect(startMock).toHaveBeenCalledTimes(1);
    expect(shutdownMock).toHaveBeenCalledTimes(1);
  });

  it('does not start twice and supports no-op shutdown', async () => {
    process.env.TRACING_ENABLED = 'true';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://custom-endpoint/v1/traces';
    process.env.OTEL_SERVICE_NAME = 'custom-service';
    process.env.NODE_ENV = 'production';
    const tracing = await loadModule();

    await tracing.startTracing();
    await tracing.startTracing();
    await tracing.shutdownTracing();
    await tracing.shutdownTracing();

    expect(startMock).toHaveBeenCalledTimes(1);
    expect(exporterCtorMock).toHaveBeenCalledWith({
      url: 'http://custom-endpoint/v1/traces',
    });
  });
});
