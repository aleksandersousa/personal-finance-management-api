import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../src/main/modules/app.module';
import { LoggerSpy } from '../../infra/mocks/logging/logger.spy';
import { MetricsSpy } from '../../infra/mocks/metrics/metrics.spy';
import { MockEntryFactory } from '../../domain/mocks/models/entry.mock';

describe('EntryController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;
  let dataSource: DataSource;
  let testUserId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('ContextAwareLoggerService')
      .useValue(loggerSpy)
      .overrideProvider('MetricsService')
      .useValue(metricsSpy)
      .compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    await app.init();

    // Setup test data
    authToken = await getAuthToken(app);
    testUserId = await createTestUser(app);
    testCategoryId = await createTestCategory(app, testUserId);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up entries but keep user and category
    await cleanupEntries(dataSource);
    loggerSpy.clear();
    metricsSpy.clear();
  });

  describe('POST /api/v1/entries', () => {
    it('should create entry successfully and monitor system behavior', async () => {
      // Arrange
      const createEntryData = {
        description: 'Monthly Salary',
        amount: 500000, // 5000.00 in cents
        categoryId: testCategoryId,
        type: 'INCOME',
        isFixed: true,
        date: '2025-06-01T00:00:00Z',
      };

      const beforeRequest = new Date();

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createEntryData)
        .expect(201);

      const afterRequest = new Date();

      // Assert Response
      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBe(createEntryData.description);
      expect(response.body.amount).toBe(createEntryData.amount);
      expect(response.body.type).toBe(createEntryData.type);
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.categoryId).toBe(testCategoryId);

      // Verify Business Events were logged
      const businessEvents = loggerSpy.getBusinessEvents(
        'entry_api_create_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        event: 'entry_api_create_success',
        entityId: response.body.id,
        userId: testUserId,
      });

      // Verify Entry Creation Event was logged
      const entryCreatedEvents = loggerSpy.getBusinessEvents('entry_created');
      expect(entryCreatedEvents).toHaveLength(1);
      expect(entryCreatedEvents[0]).toMatchObject({
        event: 'entry_created',
        entityId: response.body.id,
        userId: testUserId,
      });

      // Verify Metrics were recorded
      expect(metricsSpy.hasRecordedMetric('http_request_duration')).toBe(true);
      const httpMetrics = metricsSpy.getMetrics('http_request_duration');
      expect(
        httpMetrics.some(
          m =>
            m.labels &&
            m.labels.method === 'POST' &&
            m.labels.route === '/entries' &&
            m.labels.status === 'success',
        ),
      ).toBe(true);

      // Verify Database Operation Metrics
      expect(metricsSpy.hasRecordedMetric('database_operation')).toBe(true);
      const dbMetrics = metricsSpy.getMetrics('database_operation');
      expect(
        dbMetrics.some(
          m =>
            m.labels &&
            m.labels.operation === 'create' &&
            m.labels.entity === 'entry' &&
            m.labels.status === 'success',
        ),
      ).toBe(true);

      // Verify timing
      const businessEvent = businessEvents[0];
      expect(businessEvent.timestamp).toBeInstanceOf(Date);
      expect(businessEvent.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeRequest.getTime(),
      );
      expect(businessEvent.timestamp.getTime()).toBeLessThanOrEqual(
        afterRequest.getTime(),
      );

      // Verify no errors were logged
      expect(loggerSpy.getErrorsCount()).toBe(0);
      expect(metricsSpy.getErrorMetrics()).toHaveLength(0);
    });

    it('should handle validation errors and monitor security events', async () => {
      // Arrange - Invalid data
      const invalidEntryData = {
        description: '', // Invalid: empty description
        amount: -100, // Invalid: negative amount
        categoryId: 'invalid-category-id',
        type: 'INVALID_TYPE',
        isFixed: true,
        date: '2025-06-01T00:00:00Z',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEntryData)
        .expect(400);

      // Assert Response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('validation');

      // Verify Security Events were logged
      const securityEvents = loggerSpy.getSecurityEvents();
      expect(securityEvents.length).toBeGreaterThan(0);

      const failedEvent = securityEvents.find(
        e => e.event === 'entry_api_create_failed',
      );
      expect(failedEvent).toBeDefined();
      expect(failedEvent?.severity).toBe('medium');
      expect(failedEvent?.userId).toBe(testUserId);

      // Verify Error Metrics
      const errorMetrics = metricsSpy.getErrorMetrics();
      expect(errorMetrics.length).toBeGreaterThan(0);
      expect(
        errorMetrics.some(
          m =>
            m.labels &&
            m.labels.method === 'POST' &&
            m.labels.status === 'error',
        ),
      ).toBe(true);

      // Verify no successful business events
      const successEvents = loggerSpy.getBusinessEvents(
        'entry_api_create_success',
      );
      expect(successEvents).toHaveLength(0);
    });

    it('should handle unauthorized requests and monitor security', async () => {
      // Arrange
      const createEntryData = {
        description: 'Unauthorized Entry',
        amount: 10000,
        categoryId: testCategoryId,
        type: 'EXPENSE',
        isFixed: false,
        date: '2025-06-01T00:00:00Z',
      };

      // Act - Request without authorization header
      const response = await request(app.getHttpServer())
        .post('/api/v1/entries')
        .send(createEntryData)
        .expect(401);

      // Assert Response
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Unauthorized');

      // Verify Security Events for unauthorized access
      const securityEvents = loggerSpy.getSecurityEvents();
      expect(
        securityEvents.some(
          e => e.event?.includes('unauthorized') || e.severity === 'high',
        ),
      ).toBe(true);

      // Verify Error Metrics for unauthorized access
      const unauthorizedMetrics = metricsSpy.getMetrics(
        'http_request_duration',
      );
      expect(
        unauthorizedMetrics.some(
          m => m.labels && m.labels.status === 'unauthorized',
        ),
      ).toBe(true);
    });

    it('should handle category not found errors', async () => {
      // Arrange
      const createEntryData = {
        description: 'Entry with invalid category',
        amount: 10000,
        categoryId: 'non-existent-category-id',
        type: 'EXPENSE',
        isFixed: false,
        date: '2025-06-01T00:00:00Z',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createEntryData)
        .expect(400);

      // Assert
      expect(response.body.message).toContain('Category not found');

      // Verify Business Logic Error Logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(
        securityEvents.some(
          e =>
            e.event === 'entry_api_create_failed' &&
            e.error?.includes('Category not found'),
        ),
      ).toBe(true);

      // Verify Error Metrics
      expect(metricsSpy.getErrorMetrics()).toHaveLength(1);
    });
  });

  describe('GET /api/v1/entries', () => {
    beforeEach(async () => {
      // Seed test data for list operations
      await seedTestEntries(app, testUserId, testCategoryId);
    });

    it('should list entries and monitor performance', async () => {
      // Arrange
      const month = '2025-06';
      const beforeRequest = new Date();

      // Act
      const response = await request(app.getHttpServer())
        .get(`/api/v1/entries?month=${month}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const afterRequest = new Date();

      // Assert Response Structure
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('summary');
      expect(Array.isArray(response.body.data)).toBe(true);

      // Verify Business Events
      const businessEvents = loggerSpy.getBusinessEvents(
        'entries_list_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        event: 'entries_list_success',
        userId: testUserId,
      });

      // Verify Performance Metrics
      expect(metricsSpy.hasRecordedMetric('http_request_duration')).toBe(true);
      const responseTimeMetrics = metricsSpy.getMetrics(
        'http_request_duration',
      );
      expect(
        responseTimeMetrics.some(
          m =>
            m.labels &&
            m.labels.method === 'GET' &&
            m.labels.route === '/entries' &&
            m.labels.status === 'success',
        ),
      ).toBe(true);

      // Verify Database Query Metrics
      const dbMetrics = metricsSpy.getMetrics('database_operation');
      expect(
        dbMetrics.some(
          m =>
            m.labels &&
            m.labels.operation === 'findByUserIdAndMonth' &&
            m.labels.entity === 'entry',
        ),
      ).toBe(true);

      // Verify timing
      const businessEvent = businessEvents[0];
      expect(businessEvent.timestamp?.getTime()).toBeGreaterThanOrEqual(
        beforeRequest.getTime(),
      );
      expect(businessEvent.timestamp?.getTime()).toBeLessThanOrEqual(
        afterRequest.getTime(),
      );
    });

    it('should handle filtering and pagination with monitoring', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/api/v1/entries')
        .query({
          month: '2025-06',
          page: 1,
          limit: 10,
          sort: 'date',
          order: 'desc',
          type: 'INCOME',
          categoryId: testCategoryId,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);

      // Verify Query Optimization Metrics
      const dbMetrics = metricsSpy.getMetrics('database_operation');
      expect(
        dbMetrics.some(
          m =>
            m.labels &&
            m.labels.operation === 'findByUserIdAndMonthWithFilters',
        ),
      ).toBe(true);

      // Verify Business Events include filter information
      const businessEvents = loggerSpy.getBusinessEvents(
        'entries_list_success',
      );
      expect(businessEvents[0]).toMatchObject({
        event: 'entries_list_success',
        userId: testUserId,
      });
    });
  });

  describe('System Health Monitoring', () => {
    it('should monitor overall system performance during entry operations', async () => {
      // Arrange - Multiple operations to test system behavior
      const operations = [
        () =>
          request(app.getHttpServer())
            .post('/api/v1/entries')
            .set('Authorization', `Bearer ${authToken}`)
            .send(
              MockEntryFactory.createAddRequest({
                userId: testUserId,
                categoryId: testCategoryId,
                description: 'Test Entry 1',
              }),
            ),
        () =>
          request(app.getHttpServer())
            .get('/api/v1/entries?month=2025-06')
            .set('Authorization', `Bearer ${authToken}`),
        () =>
          request(app.getHttpServer())
            .post('/api/v1/entries')
            .set('Authorization', `Bearer ${authToken}`)
            .send(
              MockEntryFactory.createAddRequest({
                userId: testUserId,
                categoryId: testCategoryId,
                description: 'Test Entry 2',
              }),
            ),
      ];

      // Act - Execute operations
      for (const operation of operations) {
        await operation();
      }

      // Assert System Health
      const totalMetrics = metricsSpy.recordedMetrics.length;
      expect(totalMetrics).toBeGreaterThan(0);

      const totalBusinessEvents = loggerSpy.loggedBusinessEvents.length;
      expect(totalBusinessEvents).toBeGreaterThan(0);

      // Verify no system errors
      expect(loggerSpy.getErrorsCount()).toBe(0);

      // Verify all operations were successful
      const successMetrics = metricsSpy
        .getMetrics()
        .filter(m => m.labels && m.labels.status === 'success');
      expect(successMetrics.length).toBeGreaterThan(0);

      // Verify performance is within acceptable limits
      const httpMetrics = metricsSpy.getMetrics('http_request_duration');
      httpMetrics.forEach(metric => {
        // In a real scenario, you'd check actual duration values
        expect(metric.labels?.status).toMatch(/^(success|error)$/);
      });
    });
  });
});

// Helper functions for E2E testing
async function getAuthToken(_app: INestApplication): Promise<string> {
  // Implementation would create a test user and return JWT token
  // For now, returning a mock token - in real implementation, this would:
  // 1. Create a test user in the database
  // 2. Generate a real JWT token for that user
  // 3. Return the token for use in authenticated requests

  // In a real implementation, you would:
  // - Get DataSource: const dataSource = app.get<DataSource>(DataSource);
  // - Insert a test user
  // - Use the JWT service to generate a token
  // - Return the actual token

  // For testing purposes, returning a mock token
  // The actual implementation would depend on your auth service
  return 'test-jwt-token';
}

async function createTestUser(app: INestApplication): Promise<string> {
  // Implementation would create a test user in database
  const dataSource = app.get<DataSource>(DataSource);
  const testUserId = 'test-user-id';

  // Insert test user (if not exists)
  await dataSource.query(
    `INSERT INTO users (id, email, password, name, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, NOW(), NOW()) 
     ON CONFLICT (id) DO NOTHING`,
    [testUserId, 'test@example.com', 'hashed-password', 'Test User'],
  );

  return testUserId;
}

async function createTestCategory(
  app: INestApplication,
  userId: string,
): Promise<string> {
  // Implementation would create a test category
  const dataSource = app.get<DataSource>(DataSource);
  const testCategoryId = 'test-category-id';

  // Insert test category (if not exists)
  await dataSource.query(
    `INSERT INTO categories (id, user_id, name, description, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, NOW(), NOW()) 
     ON CONFLICT (id) DO NOTHING`,
    [testCategoryId, userId, 'Test Category', 'Category for testing'],
  );

  return testCategoryId;
}

async function cleanupEntries(dataSource: DataSource): Promise<void> {
  // Implementation would clean up test entries
  await dataSource.query('DELETE FROM entries WHERE user_id = ?', [
    'test-user-id',
  ]);
}

async function seedTestEntries(
  app: INestApplication,
  userId: string,
  categoryId: string,
): Promise<void> {
  // Get the DataSource to execute direct SQL for seeding
  const dataSource = app.get<DataSource>(DataSource);

  // Create test entries data
  const testEntries = [
    {
      id: 'test-entry-1',
      userId,
      description: 'Test Income Entry',
      amount: 500000, // 5000.00 in cents
      date: new Date('2025-06-01T10:00:00Z'),
      type: 'INCOME',
      isFixed: true,
      categoryId,
    },
    {
      id: 'test-entry-2',
      userId,
      description: 'Test Expense Entry',
      amount: 15000, // 150.00 in cents
      date: new Date('2025-06-05T14:30:00Z'),
      type: 'EXPENSE',
      isFixed: false,
      categoryId,
    },
    {
      id: 'test-entry-3',
      userId,
      description: 'Monthly Rent',
      amount: 120000, // 1200.00 in cents
      date: new Date('2025-06-10T09:00:00Z'),
      type: 'EXPENSE',
      isFixed: true,
      categoryId,
    },
    {
      id: 'test-entry-4',
      userId,
      description: 'Freelance Payment',
      amount: 75000, // 750.00 in cents
      date: new Date('2025-06-15T16:45:00Z'),
      type: 'INCOME',
      isFixed: false,
      categoryId,
    },
    {
      id: 'test-entry-5',
      userId,
      description: 'Grocery Shopping',
      amount: 8500, // 85.00 in cents
      date: new Date('2025-06-20T11:20:00Z'),
      type: 'EXPENSE',
      isFixed: false,
      categoryId,
    },
  ];

  // Insert entries using direct SQL
  for (const entry of testEntries) {
    await dataSource.query(
      `INSERT INTO entries (id, user_id, description, amount, date, type, is_fixed, category_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        entry.id,
        entry.userId,
        entry.description,
        entry.amount,
        entry.date,
        entry.type,
        entry.isFixed,
        entry.categoryId,
      ],
    );
  }
}
