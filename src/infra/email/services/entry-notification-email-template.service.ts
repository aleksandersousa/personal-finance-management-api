import { Injectable } from '@nestjs/common';
import {
  BaseEmailTemplateService,
  EmailTemplate,
} from './base-email-template.service';
import { EntryModel, UserModel } from '@domain/models';

export interface EntryNotificationEmailData {
  entry: EntryModel;
  user: UserModel;
}

@Injectable()
export class EntryNotificationEmailService extends BaseEmailTemplateService {
  constructor() {
    super('notifications');
  }

  async generateEmail(
    data: EntryNotificationEmailData,
  ): Promise<EmailTemplate> {
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(data.entry.amount / 100);

    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(data.entry.date);

    const templateData = {
      userName: data.user.name,
      entryDescription: data.entry.description,
      entryAmount: formattedAmount,
      entryDate: formattedDate,
      dueDate: formattedDate,
    };

    return this.renderTemplate(
      'entry-notification',
      `Lembrete: ${data.entry.description}`,
      templateData,
    );
  }
}
