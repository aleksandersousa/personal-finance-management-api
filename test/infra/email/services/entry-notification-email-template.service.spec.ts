import { Test, TestingModule } from '@nestjs/testing';
import { EntryNotificationEmailService } from '@infra/email/services/entry-notification-email-template.service';

// Mock liquidjs
const mockRenderFile = jest.fn();
jest.mock('liquidjs', () => {
  return {
    Liquid: jest.fn().mockImplementation(() => ({
      renderFile: mockRenderFile,
    })),
  };
});

describe('EntryNotificationEmailService', () => {
  let service: EntryNotificationEmailService;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    originalEnv = process.env.NODE_ENV;
    mockRenderFile.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EntryNotificationEmailService],
    }).compile();

    service = module.get<EntryNotificationEmailService>(
      EntryNotificationEmailService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEmail', () => {
    const mockEntry = {
      id: 'entry-123',
      userId: 'user-123',
      description: 'Test Entry',
      amount: 10000, // 100.00 in cents
      date: new Date('2024-01-15T10:30:00Z'),
      type: 'EXPENSE' as const,
      isFixed: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      isPaid: true,
    };

    const mockUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    it('should generate email with formatted amount and date', async () => {
      // Arrange
      const mockHtml = '<html><body>Lembrete: Test Entry</body></html>';
      const mockText = 'Lembrete: Test Entry';
      mockRenderFile
        .mockResolvedValueOnce(mockHtml)
        .mockResolvedValueOnce(mockText);

      // Act
      const result = await service.generateEmail({
        entry: mockEntry,
        user: mockUser,
      });

      // Assert
      expect(result.subject).toBe('Lembrete: Test Entry');
      expect(result.html).toBe(mockHtml);
      expect(result.text).toBe(mockText);
      expect(mockRenderFile).toHaveBeenCalledTimes(2);
    });

    it('should format template data correctly and render correct template files', async () => {
      // Arrange
      const entryWithCustomData = {
        ...mockEntry,
        amount: 15000, // 150.00 in cents
        description: 'Monthly Rent Payment',
        date: new Date('2024-01-15T14:30:00Z'),
      };

      mockRenderFile
        .mockResolvedValueOnce('<html></html>')
        .mockResolvedValueOnce('text');

      // Act
      await service.generateEmail({
        entry: entryWithCustomData,
        user: mockUser,
      });

      // Assert
      // Verify template files are called correctly with correct data
      expect(mockRenderFile).toHaveBeenNthCalledWith(
        1,
        'entry-notification.liquid',
        expect.objectContaining({
          userName: 'John Doe',
          entryDescription: 'Monthly Rent Payment',
          entryAmount: expect.stringContaining('150,00'),
          entryDate: expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/),
          dueDate: expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/),
          currentYear: expect.any(Number),
        }),
      );

      // Verify entryDate and dueDate are the same
      const templateData = mockRenderFile.mock.calls[0][1];
      expect(templateData.entryDate).toBe(templateData.dueDate);

      // Verify amount formatting (check it contains the expected value)
      expect(templateData.entryAmount).toContain('150,00');
      expect(templateData.entryAmount).toMatch(/R\$\s*150,00/);

      expect(mockRenderFile).toHaveBeenNthCalledWith(
        2,
        'entry-notification.txt.liquid',
        expect.objectContaining({
          userName: 'John Doe',
          entryDescription: 'Monthly Rent Payment',
          entryAmount: expect.stringContaining('150,00'),
          entryDate: expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/),
          dueDate: expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/),
          currentYear: expect.any(Number),
        }),
      );
    });

    it('should handle template rendering errors', async () => {
      // Arrange
      const error = new Error('Template not found');
      mockRenderFile.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        service.generateEmail({
          entry: mockEntry,
          user: mockUser,
        }),
      ).rejects.toThrow('Failed to generate email: entry-notification');
    });
  });
});
