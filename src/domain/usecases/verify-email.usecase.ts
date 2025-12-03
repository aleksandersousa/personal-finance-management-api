export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailUseCase {
  execute(request: VerifyEmailRequest): Promise<VerifyEmailResponse>;
}
