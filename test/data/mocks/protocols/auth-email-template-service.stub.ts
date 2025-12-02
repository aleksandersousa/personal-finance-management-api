import {
  AuthEmailTemplateService,
  EmailTemplate,
  WelcomeEmailData,
  PasswordResetEmailData,
  VerifyEmailData,
} from '@data/protocols/email-template';

/**
 * AuthEmailTemplateService Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class AuthEmailTemplateServiceStub implements AuthEmailTemplateService {
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private renderedTemplates: Array<{
    type: 'welcome' | 'password-reset' | 'verify-email';
    data: any;
  }> = [];

  async getWelcomeEmail(data: WelcomeEmailData): Promise<EmailTemplate> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    this.renderedTemplates.push({ type: 'welcome', data });

    return {
      subject: 'Welcome to Personal Financial Management!',
      html: `<h1>Welcome ${data.userName}!</h1><p>Dashboard: ${data.dashboardUrl}</p>`,
      text: `Welcome ${data.userName}! Dashboard: ${data.dashboardUrl}`,
    };
  }

  async getPasswordResetEmail(
    data: PasswordResetEmailData,
  ): Promise<EmailTemplate> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    this.renderedTemplates.push({ type: 'password-reset', data });

    return {
      subject: 'Password Reset Request',
      html: `<h2>Password Reset</h2><p>Hello ${data.userName}, reset link: ${data.resetUrl}</p>`,
      text: `Password Reset - Hello ${data.userName}, reset link: ${data.resetUrl}`,
    };
  }

  async getVerifyEmailEmail(data: VerifyEmailData): Promise<EmailTemplate> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    this.renderedTemplates.push({ type: 'verify-email', data });

    return {
      subject: 'Verify Your Email Address',
      html: `<h2>Verify Email</h2><p>Hello ${data.userName}, verification link: ${data.verificationUrl}</p>`,
      text: `Verify Email - Hello ${data.userName}, verification link: ${data.verificationUrl}`,
    };
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all state and reset error state
   */
  clear(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
    this.renderedTemplates = [];
  }

  /**
   * Configure the stub to throw an error on next operation
   */
  mockFailure(error: Error): void {
    this.shouldFail = true;
    this.errorToThrow = error;
  }

  /**
   * Configure the stub to operate normally
   */
  mockSuccess(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
  }

  /**
   * Get all rendered templates
   */
  getRenderedTemplates(): Array<{
    type: 'welcome' | 'password-reset' | 'verify-email';
    data: any;
  }> {
    return [...this.renderedTemplates];
  }

  /**
   * Get count of rendered templates
   */
  getTemplateCount(): number {
    return this.renderedTemplates.length;
  }

  /**
   * Check if welcome email was rendered
   */
  wasWelcomeEmailRendered(): boolean {
    return this.renderedTemplates.some(t => t.type === 'welcome');
  }

  /**
   * Get last rendered template
   */
  getLastRenderedTemplate():
    | { type: 'welcome' | 'password-reset' | 'verify-email'; data: any }
    | undefined {
    return this.renderedTemplates[this.renderedTemplates.length - 1];
  }
}
