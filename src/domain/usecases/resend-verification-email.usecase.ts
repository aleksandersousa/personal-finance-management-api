export interface ResendVerificationEmailRequest {
  email: string;
}

export interface ResendVerificationEmailResponse {
  success: boolean;
  message: string;
}

export interface ResendVerificationEmailUseCase {
  execute(
    request: ResendVerificationEmailRequest,
  ): Promise<ResendVerificationEmailResponse>;
}
