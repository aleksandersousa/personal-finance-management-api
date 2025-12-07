export interface CancelNotificationRequest {
  entryId: string;
}

export interface CancelNotificationResponse {
  success: boolean;
}

export interface CancelNotificationUseCase {
  execute(
    request: CancelNotificationRequest,
  ): Promise<CancelNotificationResponse>;
}
