import { Injectable } from '@nestjs/common';
import {
  BaseEmailTemplateService,
  EmailTemplate,
} from './base-email-template.service';

export interface MonthlySummaryEmailData {
  userName: string;
  month: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  dashboardUrl: string;
}

export interface BudgetAlertEmailData {
  userName: string;
  category: string;
  percentUsed: number;
  amountUsed: number;
  budgetLimit: number;
  dashboardUrl: string;
}

export interface TransactionReceiptEmailData {
  userName: string;
  transactionId: string;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
}

@Injectable()
export class FinancialEmailTemplateService extends BaseEmailTemplateService {
  constructor() {
    super('financial');
  }

  async getMonthlySummaryEmail(
    data: MonthlySummaryEmailData,
  ): Promise<EmailTemplate> {
    return this.renderTemplate(
      'monthly-summary',
      `Your ${data.month} Financial Summary`,
      data,
    );
  }

  async getBudgetAlertEmail(
    data: BudgetAlertEmailData,
  ): Promise<EmailTemplate> {
    return this.renderTemplate(
      'budget-alert',
      `Budget Alert: ${data.category}`,
      data,
    );
  }

  async getTransactionReceiptEmail(
    data: TransactionReceiptEmailData,
  ): Promise<EmailTemplate> {
    return this.renderTemplate(
      'transaction-receipt',
      'Transaction Confirmation',
      data,
    );
  }
}
