import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailSender, SendEmailParams, SendEmailResult } from '@data/protocols';
import Mailgun from 'mailgun.js';

@Injectable()
export class MailgunEmailSender implements EmailSender {
  private readonly logger = new Logger(MailgunEmailSender.name);
  private readonly mailgunClient: any;
  private readonly domain: string;
  private readonly defaultFrom: string;

  constructor(private readonly configService: ConfigService) {
    const apiUrl = this.configService.get<string>('MAILGUN_API_URL');
    const apiKey = this.configService.get<string>('MAILGUN_API_KEY');
    const fromEmail = this.configService.get<string>('MAILGUN_FROM_EMAIL');
    const fromName = this.configService.get<string>('MAILGUN_FROM_NAME');
    this.domain = this.configService.get<string>('MAILGUN_DOMAIN');

    this.defaultFrom = `${fromName} <${fromEmail}>`;

    const mailgun = new Mailgun(FormData);
    this.mailgunClient = mailgun.client({
      username: 'api',
      key: apiKey,
      url: apiUrl,
    });
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      this.logger.log(`Sending email to: ${params.to}`);

      const messageData = this.prepareMessageData(params);

      const response = await this.mailgunClient.messages.create(
        this.domain,
        messageData,
      );

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

  private prepareMessageData(params: SendEmailParams): any {
    const messageData: any = {
      from: params.from || this.defaultFrom,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
    };

    if (params.text) {
      messageData.text = params.text;
    }

    if (params.html) {
      messageData.html = params.html;
    }

    if (params.cc) {
      messageData.cc = Array.isArray(params.cc) ? params.cc : [params.cc];
    }

    if (params.bcc) {
      messageData.bcc = Array.isArray(params.bcc) ? params.bcc : [params.bcc];
    }

    if (params.replyTo) {
      messageData['h:Reply-To'] = params.replyTo;
    }

    if (params.attachments && params.attachments.length > 0) {
      messageData.attachment = params.attachments.map(attachment => {
        // Convert content to Buffer if needed
        const data =
          typeof attachment.content === 'string'
            ? Buffer.from(attachment.content)
            : Buffer.isBuffer(attachment.content)
              ? attachment.content
              : Buffer.from(attachment.content);

        return {
          filename: attachment.filename,
          data: data,
        };
      });
    }

    return messageData;
  }
}
