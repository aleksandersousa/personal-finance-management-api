import { Injectable, Inject } from '@nestjs/common';
import { SendNotificationUseCase } from '@domain/usecases/send-notification.usecase';

export interface NotificationWorkerResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class NotificationWorker {
  constructor(
    @Inject('SendNotificationUseCase')
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async processNotification(
    notificationId: string,
    entryId: string,
    userId: string,
  ): Promise<NotificationWorkerResult> {
    try {
      const result = await this.sendNotificationUseCase.execute({
        notificationId,
        entryId,
        userId,
      });

      return {
        success: result.success,
        messageId: result.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
