import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
  type Logger,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RegisterUserUseCase } from '@domain/usecases/register-user.usecase';
import { LoginUserUseCase } from '@domain/usecases/login-user.usecase';
import { RefreshTokenUseCase } from '@domain/usecases/refresh-token.usecase';
import { VerifyEmailUseCase } from '@domain/usecases/verify-email.usecase';
import { ResendVerificationEmailUseCase } from '@domain/usecases/resend-verification-email.usecase';
import { RequestPasswordResetUseCase } from '@domain/usecases/request-password-reset.usecase';
import { ResetPasswordUseCase } from '@domain/usecases/reset-password.usecase';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { LoginUserDto } from '../dtos/login-user.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { VerifyEmailDto } from '../dtos/auth/verify-email.dto';
import { ResendVerificationDto } from '../dtos/auth/resend-verification.dto';
import { RequestPasswordResetDto } from '../dtos/auth/request-password-reset.dto';
import { ResetPasswordDto } from '../dtos/auth/reset-password.dto';
import { RegisterResponseDto } from '../dtos/register-response.dto';
import { LoginResponseDto } from '../dtos/login-response.dto';
import { RefreshTokenResponseDto } from '../dtos/refresh-token-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('RegisterUserUseCase')
    private readonly registerUserUseCase: RegisterUserUseCase,
    @Inject('LoginUserUseCase')
    private readonly loginUserUseCase: LoginUserUseCase,
    @Inject('RefreshTokenUseCase')
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    @Inject('VerifyEmailUseCase')
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    @Inject('ResendVerificationEmailUseCase')
    private readonly resendVerificationEmailUseCase: ResendVerificationEmailUseCase,
    @Inject('RequestPasswordResetUseCase')
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    @Inject('ResetPasswordUseCase')
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    @Inject('Logger')
    private readonly logger: Logger,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or user already exists',
  })
  @ApiBody({ type: RegisterUserDto })
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<RegisterResponseDto> {
    try {
      const result = await this.registerUserUseCase.execute({
        name: registerUserDto.name,
        email: registerUserDto.email,
        password: registerUserDto.password,
      });

      return {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        createdAt: result.user.createdAt,
        message: result.message,
      };
    } catch (error) {
      if (error.message.includes('already exists')) {
        this.logger.error(
          'User already exists',
          registerUserDto.email,
          'AuthController',
        );
        throw new BadRequestException('User already exists');
      }
      this.logger.error(
        'User registration failed',
        error.stack,
        'AuthController',
      );
      throw new BadRequestException('User registration failed');
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @ApiBody({ type: LoginUserDto })
  async login(@Body() loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    try {
      const result = await this.loginUserUseCase.execute({
        email: loginUserDto.email,
        password: loginUserDto.password,
      });

      return {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: 900, // 15 minutes
        },
      };
    } catch (error) {
      if (error.message.includes('Email not verified')) {
        this.logger.error('Email not verified', error.stack, 'AuthController');
        throw new UnauthorizedException(error.message);
      }
      this.logger.error('Invalid credentials', error.stack, 'AuthController');
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({
    status: 200,
    description: 'E-mail verificado com sucesso!',
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired token',
  })
  @ApiBody({ type: VerifyEmailDto })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    try {
      const result = await this.verifyEmailUseCase.execute({
        token: verifyEmailDto.token,
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      this.logger.error(
        'Email verification failed',
        error.stack,
        'AuthController',
      );
      throw new BadRequestException(error.message);
    }
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({
    status: 200,
    description: 'E-mail de verificação reenviado com sucesso!',
  })
  @ApiBody({ type: ResendVerificationDto })
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    try {
      const result = await this.resendVerificationEmailUseCase.execute({
        email: resendVerificationDto.email,
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      this.logger.error(
        'Resend verification failed',
        error.stack,
        'AuthController',
      );
      throw new BadRequestException('Failed to resend verification email');
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    try {
      const result = await this.refreshTokenUseCase.execute({
        refreshToken: refreshTokenDto.refreshToken,
      });

      return {
        accessToken: result.accessToken,
        expiresIn: 900, // 15 minutes
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description:
      'Se o email existe e está verificado, um link de redefinição de senha foi enviado.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format or email not verified',
  })
  @ApiBody({ type: RequestPasswordResetDto })
  async forgotPassword(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ) {
    try {
      const result = await this.requestPasswordResetUseCase.execute({
        email: requestPasswordResetDto.email,
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      this.logger.error(
        'Password reset request failed',
        error.stack,
        'AuthController',
      );
      throw new BadRequestException(error.message);
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid, expired, or already used token, or weak password',
  })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      const result = await this.resetPasswordUseCase.execute({
        token: resetPasswordDto.token,
        newPassword: resetPasswordDto.newPassword,
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      this.logger.error('Password reset failed', error.stack, 'AuthController');
      throw new BadRequestException(error.message);
    }
  }
}
