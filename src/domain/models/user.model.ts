export interface UserModel {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPayload {
  id: string;
  email: string;
}
