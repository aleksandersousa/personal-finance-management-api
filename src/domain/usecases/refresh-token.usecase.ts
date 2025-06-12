export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenUseCase {
  execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
}
