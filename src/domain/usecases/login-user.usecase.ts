import { UserModel } from "../models/user.model";

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  user: Omit<UserModel, "password">;
  accessToken: string;
  refreshToken: string;
}

export interface LoginUserUseCase {
  execute(request: LoginUserRequest): Promise<LoginUserResponse>;
}
