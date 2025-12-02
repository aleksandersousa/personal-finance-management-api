import { Injectable, Logger } from '@nestjs/common';
import { Liquid } from 'liquidjs';
import * as path from 'path';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface WelcomeEmailData {
  userName: string;
  dashboardUrl: string;
}

export interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  expirationTime: string;
}

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);
  private readonly engine: Liquid;
  private readonly templatesPath: string;

  constructor() {
    this.templatesPath = path.join(__dirname, 'templates');
    this.engine = new Liquid({
      root: this.templatesPath,
      extname: '.liquid',
      cache: process.env.NODE_ENV === 'production',
    });

    this.logger.log(`Email templates loaded from: ${this.templatesPath}`);
  }

  async getWelcomeEmail(data: WelcomeEmailData): Promise<EmailTemplate> {
    try {
      const templateData = {
        ...data,
        currentYear: new Date().getFullYear(),
      };

      const [html, text] = await Promise.all([
        this.engine.renderFile('welcome', templateData),
        this.engine.renderFile('welcome.txt', templateData),
      ]);

      return {
        subject: 'Welcome to Personal Financial Management!',
        html,
        text,
      };
    } catch (error) {
      this.logger.error(
        `Failed to render welcome email template: ${error.message}`,
        error.stack,
      );
      throw new Error('Failed to generate welcome email');
    }
  }

  async getPasswordResetEmail(
    data: PasswordResetEmailData,
  ): Promise<EmailTemplate> {
    try {
      const templateData = {
        ...data,
        currentYear: new Date().getFullYear(),
      };

      const [html, text] = await Promise.all([
        this.engine.renderFile('password-reset', templateData),
        this.engine.renderFile('password-reset.txt', templateData),
      ]);

      return {
        subject: 'Password Reset Request',
        html,
        text,
      };
    } catch (error) {
      this.logger.error(
        `Failed to render password reset email template: ${error.message}`,
        error.stack,
      );
      throw new Error('Failed to generate password reset email');
    }
  }
}
