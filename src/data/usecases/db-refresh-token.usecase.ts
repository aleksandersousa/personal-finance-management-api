import {
  RefreshTokenRequest,
  RefreshTokenResponse,
  RefreshTokenUseCase,
} from '@domain/usecases/refresh-token.usecase';
import { TokenGenerator } from '../protocols/token-generator';
import { UserRepository } from '../protocols/user-repository';

export class DbRefreshTokenUseCase implements RefreshTokenUseCase {
  constructor(
    private readonly tokenGenerator: TokenGenerator,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    // Validate input
    if (!request.refreshToken) {
      throw new Error('Refresh token is required');
    }

    try {
      // Verify the refresh token
      const payload = await this.tokenGenerator.verifyRefreshToken(
        request.refreshToken,
      );

      // Validate that the user still exists
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const tokens = await this.tokenGenerator.generateTokens({
        userId: user.id,
        email: user.email,
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}
