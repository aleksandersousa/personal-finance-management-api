export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Auth Email Data Interfaces
export interface WelcomeEmailData {
  userName: string;
  dashboardUrl: string;
}

export interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  expirationTime: string;
}

export interface VerifyEmailData {
  userName: string;
  verificationUrl: string;
  expirationTime: string;
}

// Financial Email Data Interfaces
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

// Service Interfaces
export interface AuthEmailTemplateService {
  getWelcomeEmail(data: WelcomeEmailData): Promise<EmailTemplate>;
  getPasswordResetEmail(data: PasswordResetEmailData): Promise<EmailTemplate>;
  getVerifyEmailEmail(data: VerifyEmailData): Promise<EmailTemplate>;
}

export interface FinancialEmailTemplateService {
  getMonthlySummaryEmail(data: MonthlySummaryEmailData): Promise<EmailTemplate>;
  getBudgetAlertEmail(data: BudgetAlertEmailData): Promise<EmailTemplate>;
  getTransactionReceiptEmail(
    data: TransactionReceiptEmailData,
  ): Promise<EmailTemplate>;
}
