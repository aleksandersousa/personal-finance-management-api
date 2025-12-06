export interface SendNotificationRequest {
  notificationId: string;
  entryId: string;
  userId: string;
}

export interface SendNotificationResponse {
  success: boolean;
  messageId?: string;
}

export interface SendNotificationUseCase {
  execute(request: SendNotificationRequest): Promise<SendNotificationResponse>;
}
