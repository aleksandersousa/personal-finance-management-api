export interface UserModel {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  notificationEnabled?: boolean;
  notificationTimeMinutes?: number;
  timezone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPayload {
  id: string;
  email: string;
}
