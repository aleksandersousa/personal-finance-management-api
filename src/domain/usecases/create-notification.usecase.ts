import { NotificationModel, EntryModel, UserModel } from '@domain/models';

export interface CreateNotificationRequest {
  entryId: string;
  userId: string;
  entry: EntryModel;
  user: UserModel;
}

export interface CreateNotificationResponse {
  notification: NotificationModel;
}

export interface CreateNotificationUseCase {
  execute(
    request: CreateNotificationRequest,
  ): Promise<CreateNotificationResponse>;
}
