import { Test, TestingModule } from '@nestjs/testing';
import {
  MonthlySummaryEmailData,
  BudgetAlertEmailData,
  TransactionReceiptEmailData,
  FinancialEmailTemplateService,
} from '@infra/email/services/financial-email-template.service';
import { BaseEmailTemplateService } from '@infra/email/services/base-email-template.service';

describe('FinancialEmailTemplateService', () => {
  let service: FinancialEmailTemplateService;
  let renderTemplateSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancialEmailTemplateService],
    }).compile();

    service = module.get<FinancialEmailTemplateService>(
      FinancialEmailTemplateService,
    );

    // Spy on the protected renderTemplate method
    renderTemplateSpy = jest.spyOn(
      BaseEmailTemplateService.prototype as any,
      'renderTemplate',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMonthlySummaryEmail', () => {
    it('should render monthly summary email template with correct data', async () => {
      // Arrange
      const emailData: MonthlySummaryEmailData = {
        userName: 'John Doe',
        month: 'January 2024',
        totalIncome: 5000,
        totalExpenses: 3000,
        netSavings: 2000,
        dashboardUrl: 'https://example.com/dashboard',
      };
      const expectedTemplate = {
        subject: 'Your January 2024 Financial Summary',
        html: '<html>Summary</html>',
        text: 'Summary text',
      };
      renderTemplateSpy.mockResolvedValue(expectedTemplate);

      // Act
      const result = await service.getMonthlySummaryEmail(emailData);

      // Assert
      expect(result).toEqual(expectedTemplate);
      expect(renderTemplateSpy).toHaveBeenCalledWith(
        'monthly-summary',
        'Your January 2024 Financial Summary',
        emailData,
      );
    });
  });

  describe('getBudgetAlertEmail', () => {
    it('should render budget alert email template with correct data', async () => {
      // Arrange
      const emailData: BudgetAlertEmailData = {
        userName: 'John Doe',
        category: 'Groceries',
        percentUsed: 85,
        amountUsed: 850,
        budgetLimit: 1000,
        dashboardUrl: 'https://example.com/dashboard',
      };
      const expectedTemplate = {
        subject: 'Budget Alert: Groceries',
        html: '<html>Alert</html>',
        text: 'Alert text',
      };
      renderTemplateSpy.mockResolvedValue(expectedTemplate);

      // Act
      const result = await service.getBudgetAlertEmail(emailData);

      // Assert
      expect(result).toEqual(expectedTemplate);
      expect(renderTemplateSpy).toHaveBeenCalledWith(
        'budget-alert',
        'Budget Alert: Groceries',
        emailData,
      );
    });
  });

  describe('getTransactionReceiptEmail', () => {
    it('should render transaction receipt email template for income', async () => {
      // Arrange
      const emailData: TransactionReceiptEmailData = {
        userName: 'John Doe',
        transactionId: 'txn-123',
        description: 'Salary payment',
        amount: 5000,
        date: '2024-01-15',
        type: 'INCOME',
      };
      const expectedTemplate = {
        subject: 'Transaction Confirmation',
        html: '<html>Receipt</html>',
        text: 'Receipt text',
      };
      renderTemplateSpy.mockResolvedValue(expectedTemplate);

      // Act
      const result = await service.getTransactionReceiptEmail(emailData);

      // Assert
      expect(result).toEqual(expectedTemplate);
      expect(renderTemplateSpy).toHaveBeenCalledWith(
        'transaction-receipt',
        'Transaction Confirmation',
        emailData,
      );
    });

    it('should render transaction receipt email template for expense', async () => {
      // Arrange
      const emailData: TransactionReceiptEmailData = {
        userName: 'Jane Smith',
        transactionId: 'txn-456',
        description: 'Grocery shopping',
        amount: 150.5,
        date: '2024-01-16',
        type: 'EXPENSE',
      };
      renderTemplateSpy.mockResolvedValue({
        subject: 'Transaction Confirmation',
        html: '',
        text: '',
      });

      // Act
      await service.getTransactionReceiptEmail(emailData);

      // Assert
      expect(renderTemplateSpy).toHaveBeenCalledWith(
        'transaction-receipt',
        'Transaction Confirmation',
        emailData,
      );
    });
  });

  describe('error handling', () => {
    it('should propagate errors from base service', async () => {
      // Arrange
      const emailData: MonthlySummaryEmailData = {
        userName: 'John Doe',
        month: 'January 2024',
        totalIncome: 5000,
        totalExpenses: 3000,
        netSavings: 2000,
        dashboardUrl: 'https://example.com/dashboard',
      };
      const error = new Error('Template rendering failed');
      renderTemplateSpy.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getMonthlySummaryEmail(emailData)).rejects.toThrow(
        'Template rendering failed',
      );
    });
  });
});
