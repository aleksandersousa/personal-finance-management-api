export interface RequestPasswordResetRequest {
  email: string;
}

export interface RequestPasswordResetResponse {
  success: boolean;
  message: string;
}

export interface RequestPasswordResetUseCase {
  execute(
    request: RequestPasswordResetRequest,
  ): Promise<RequestPasswordResetResponse>;
}
