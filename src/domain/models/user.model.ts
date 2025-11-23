export interface UserModel {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPayload {
  id: string;
  email: string;
}
