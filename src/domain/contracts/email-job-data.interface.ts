import { BaseJobData } from '@domain/contracts';
import { SendEmailParams } from '@data/protocols';

export type EmailType =
  | 'verification'
  | 'password-reset'
  | 'welcome'
  | 'generic';

export interface EmailJobData extends BaseJobData {
  emailParams: SendEmailParams;
  emailType?: EmailType;
}
