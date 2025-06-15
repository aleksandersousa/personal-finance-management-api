import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { MetricsController } from '@presentation/controllers/metrics.controller';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: jest.Mocked<FinancialMetricsService>;
  let mockResponse: jest.Mocked<Response>;

  beforeEach(async () => {
    const metricsServiceMock = {
      getMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: FinancialMetricsService,
          useValue: metricsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    metricsService = module.get(FinancialMetricsService);

    // Mock Express Response
    mockResponse = {
      set: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', async () => {
      // Arrange
      const mockMetrics = `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="get",route="/health",status_code="200"} 1
# HELP entries_created_total Total number of entries created
# TYPE entries_created_total counter
entries_created_total 42`;

      metricsService.getMetrics.mockResolvedValue(mockMetrics);

      // Act
      await controller.getMetrics(mockResponse);

      // Assert
      expect(metricsService.getMetrics).toHaveBeenCalledTimes(1);
      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain; version=0.0.4; charset=utf-8',
      );
      expect(mockResponse.end).toHaveBeenCalledWith(mockMetrics);
    });

    it('should set correct content type header', async () => {
      // Arrange
      const mockMetrics = 'test_metric 1';
      metricsService.getMetrics.mockResolvedValue(mockMetrics);

      // Act
      await controller.getMetrics(mockResponse);

      // Assert
      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain; version=0.0.4; charset=utf-8',
      );
    });

    it('should handle metrics service errors', async () => {
      // Arrange
      const error = new Error('Metrics service unavailable');
      metricsService.getMetrics.mockRejectedValue(error);

      // Act
      await controller.getMetrics(mockResponse);

      // Assert
      expect(metricsService.getMetrics).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to retrieve metrics',
        message: 'Metrics service unavailable',
      });
    });

    it('should handle metrics service errors with generic message', async () => {
      // Arrange
      const error = { message: 'Database connection failed' };
      metricsService.getMetrics.mockRejectedValue(error);

      // Act
      await controller.getMetrics(mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to retrieve metrics',
        message: 'Database connection failed',
      });
    });

    it('should handle empty metrics response', async () => {
      // Arrange
      metricsService.getMetrics.mockResolvedValue('');

      // Act
      await controller.getMetrics(mockResponse);

      // Assert
      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain; version=0.0.4; charset=utf-8',
      );
      expect(mockResponse.end).toHaveBeenCalledWith('');
    });

    it('should handle large metrics payload', async () => {
      // Arrange
      const largeMetrics = 'large_metric 1\n'.repeat(1000);
      metricsService.getMetrics.mockResolvedValue(largeMetrics);

      // Act
      await controller.getMetrics(mockResponse);

      // Assert
      expect(mockResponse.end).toHaveBeenCalledWith(largeMetrics);
      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain; version=0.0.4; charset=utf-8',
      );
    });

    it('should handle service timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      metricsService.getMetrics.mockRejectedValue(timeoutError);

      // Act
      await controller.getMetrics(mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to retrieve metrics',
        message: 'Request timeout',
      });
    });
  });
});
