import { Logger } from '@nestjs/common';
import { Liquid } from 'liquidjs';
import * as path from 'path';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export abstract class BaseEmailTemplateService {
  protected readonly logger: Logger;
  protected readonly engine: Liquid;

  constructor(templateSubdirectory: string) {
    let templatesPath: string;

    if (process.env.NODE_ENV === 'production' || __dirname.includes('dist')) {
      // When running from dist, resolve to source templates directory
      // Use process.cwd() to get project root, then navigate to source templates
      const projectRoot = process.cwd();
      templatesPath = path.resolve(
        projectRoot,
        'src',
        'infra',
        'email',
        'templates',
        templateSubdirectory,
      );
    } else {
      // When running from source, templates are one level up
      templatesPath = path.resolve(
        __dirname,
        '..',
        'templates',
        templateSubdirectory,
      );
    }

    this.engine = new Liquid({
      root: templatesPath,
      // Don't set extname since we're passing full filenames with .liquid extension
      cache: process.env.NODE_ENV === 'production',
    });

    this.logger = new Logger(this.constructor.name);
    this.logger.log(`Templates loaded from: ${templatesPath}`);
  }

  protected async renderTemplate(
    templateName: string,
    subject: string,
    data: Record<string, any>,
  ): Promise<EmailTemplate> {
    try {
      const templateData = {
        ...data,
        currentYear: new Date().getFullYear(),
      };

      const [html, text] = await Promise.all([
        this.engine.renderFile(`${templateName}.liquid`, templateData),
        this.engine.renderFile(`${templateName}.txt.liquid`, templateData),
      ]);

      return {
        subject,
        html,
        text,
      };
    } catch (error) {
      this.logger.error(
        `Failed to render template '${templateName}': ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to generate email: ${templateName}`);
    }
  }
}
