import { UserModel } from '../models/user.model';

export interface RegisterUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  user: Omit<UserModel, 'password'>;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterUserUseCase {
  execute(request: RegisterUserRequest): Promise<RegisterUserResponse>;
}
