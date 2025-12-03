import {
  EmailSender,
  SendEmailParams,
  SendEmailResult,
} from '@data/protocols/email-sender';

/**
 * EmailSender Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class EmailSenderStub implements EmailSender {
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private sentEmails: SendEmailParams[] = [];
  private messageIdCounter = 0;

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    if (this.shouldFail && this.errorToThrow) {
      return {
        success: false,
        error: this.errorToThrow.message,
      };
    }

    this.sentEmails.push(params);
    this.messageIdCounter += 1;

    return {
      success: true,
      messageId: `mock-message-id-${this.messageIdCounter}`,
    };
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all state and reset error state
   */
  clear(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
    this.sentEmails = [];
    this.messageIdCounter = 0;
  }

  /**
   * Configure the stub to throw an error on next operation
   */
  mockFailure(error: Error): void {
    this.shouldFail = true;
    this.errorToThrow = error;
  }

  /**
   * Configure the stub to return failure result
   */
  mockFailureResult(errorMessage: string): void {
    this.shouldFail = true;
    this.errorToThrow = new Error(errorMessage);
  }

  /**
   * Configure the stub to operate normally
   */
  mockSuccess(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
  }

  /**
   * Get all emails that were sent
   */
  getSentEmails(): SendEmailParams[] {
    return [...this.sentEmails];
  }

  /**
   * Get count of emails sent
   */
  getEmailCount(): number {
    return this.sentEmails.length;
  }

  /**
   * Check if email was sent to specific address
   */
  wasEmailSentTo(email: string): boolean {
    return this.sentEmails.some(emailParams =>
      Array.isArray(emailParams.to)
        ? emailParams.to.includes(email)
        : emailParams.to === email,
    );
  }

  /**
   * Get last sent email
   */
  getLastSentEmail(): SendEmailParams | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }
}
