import { Injectable } from '@nestjs/common';
import {
  BaseEmailTemplateService,
  EmailTemplate,
} from './base-email-template.service';

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

@Injectable()
export class AuthEmailTemplateService extends BaseEmailTemplateService {
  constructor() {
    super('auth');
  }

  async getWelcomeEmail(data: WelcomeEmailData): Promise<EmailTemplate> {
    return this.renderTemplate(
      'welcome',
      'Welcome to Personal Financial Management!',
      data,
    );
  }

  async getPasswordResetEmail(
    data: PasswordResetEmailData,
  ): Promise<EmailTemplate> {
    return this.renderTemplate(
      'password-reset',
      'Password Reset Request',
      data,
    );
  }

  async getVerifyEmailEmail(data: VerifyEmailData): Promise<EmailTemplate> {
    return this.renderTemplate(
      'verify-email',
      'Verify Your Email Address',
      data,
    );
  }
}
