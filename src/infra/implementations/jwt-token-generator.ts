import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  TokenGenerator,
  TokenPair,
  TokenPayload,
} from '@data/protocols/token-generator';

@Injectable()
export class JwtTokenGenerator implements TokenGenerator {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(payload: TokenPayload): Promise<TokenPair> {
    const accessTokenSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshTokenSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');
    const accessTokenExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    const refreshTokenExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessTokenSecret,
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshTokenSecret,
      expiresIn: refreshTokenExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const accessTokenSecret =
        this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = this.jwtService.verify(token, {
        secret: accessTokenSecret,
      });

      return {
        userId: payload.userId,
        email: payload.email,
      };
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const refreshTokenSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET');
      const payload = this.jwtService.verify(token, {
        secret: refreshTokenSecret,
      });

      return {
        userId: payload.userId,
        email: payload.email,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
