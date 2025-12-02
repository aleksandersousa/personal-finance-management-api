import { Injectable, Logger } from '@nestjs/common';
import { EmailSender, SendEmailParams, SendEmailResult } from '@data/protocols';
import { emailConfig } from '@main/config';

@Injectable()
export class MailgunEmailSender implements EmailSender {
  private readonly logger = new Logger(MailgunEmailSender.name);
  private readonly apiKey: string;
  private readonly domain: string;
  private readonly apiUrl: string;
  private readonly defaultFrom: string;

  constructor() {
    this.apiKey = emailConfig.mailgun.apiKey;
    this.domain = emailConfig.mailgun.domain;
    this.apiUrl = emailConfig.mailgun.apiUrl;
    this.defaultFrom = `${emailConfig.mailgun.from.name} <${emailConfig.mailgun.from.email}>`;
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      this.logger.log(`Sending email to: ${params.to}`);

      const formData = this.prepareFormData(params);

      const response = await this.sendToMailgun(formData);

      this.logger.log(`Email sent successfully. Message ID: ${response.id}`);

      return {
        success: true,
        messageId: response.id,
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private prepareFormData(params: SendEmailParams): FormData {
    const formData = new FormData();

    const from = params.from || this.defaultFrom;
    formData.append('from', from);

    const toAddresses = Array.isArray(params.to) ? params.to : [params.to];
    toAddresses.forEach(to => formData.append('to', to));

    formData.append('subject', params.subject);

    if (params.text) {
      formData.append('text', params.text);
    }
    if (params.html) {
      formData.append('html', params.html);
    }

    if (params.cc) {
      const ccAddresses = Array.isArray(params.cc) ? params.cc : [params.cc];
      ccAddresses.forEach(cc => formData.append('cc', cc));
    }

    if (params.bcc) {
      const bccAddresses = Array.isArray(params.bcc)
        ? params.bcc
        : [params.bcc];
      bccAddresses.forEach(bcc => formData.append('bcc', bcc));
    }

    if (params.replyTo) {
      formData.append('h:Reply-To', params.replyTo);
    }

    if (params.attachments && params.attachments.length > 0) {
      params.attachments.forEach(attachment => {
        const content =
          typeof attachment.content === 'string'
            ? attachment.content
            : new Uint8Array(attachment.content);
        const blob = new Blob([content], {
          type: attachment.contentType || 'application/octet-stream',
        });
        formData.append('attachment', blob, attachment.filename);
      });
    }

    return formData;
  }

  private async sendToMailgun(formData: FormData): Promise<any> {
    const url = `${this.apiUrl}/${this.domain}/messages`;

    const auth = Buffer.from(`api:${this.apiKey}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mailgun API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
}
