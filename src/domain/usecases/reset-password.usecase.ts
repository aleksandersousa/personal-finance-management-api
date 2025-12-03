export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordUseCase {
  execute(request: ResetPasswordRequest): Promise<ResetPasswordResponse>;
}
