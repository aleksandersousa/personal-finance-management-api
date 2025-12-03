import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from '@presentation/controllers/auth.controller';
import { RegisterUserUseCase } from '@domain/usecases/register-user.usecase';
import { LoginUserUseCase } from '@domain/usecases/login-user.usecase';
import { RefreshTokenUseCase } from '@domain/usecases/refresh-token.usecase';
import { VerifyEmailUseCase } from '@domain/usecases/verify-email.usecase';
import { ResendVerificationEmailUseCase } from '@domain/usecases/resend-verification-email.usecase';
import { RegisterUserDto } from '@presentation/dtos/register-user.dto';
import { LoginUserDto } from '@presentation/dtos/login-user.dto';
import { RefreshTokenDto } from '@presentation/dtos/refresh-token.dto';
import { VerifyEmailDto } from '@presentation/dtos/auth/verify-email.dto';
import { ResendVerificationDto } from '@presentation/dtos/auth/resend-verification.dto';
import type { Logger } from '@/data/protocols';

describe('AuthController', () => {
  let controller: AuthController;
  let mockRegisterUserUseCase: jest.Mocked<RegisterUserUseCase>;
  let mockLoginUserUseCase: jest.Mocked<LoginUserUseCase>;
  let mockRefreshTokenUseCase: jest.Mocked<RefreshTokenUseCase>;
  let mockVerifyEmailUseCase: jest.Mocked<VerifyEmailUseCase>;
  let mockResendVerificationEmailUseCase: jest.Mocked<ResendVerificationEmailUseCase>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    mockRegisterUserUseCase = {
      execute: jest.fn(),
    };
    mockLoginUserUseCase = {
      execute: jest.fn(),
    };
    mockRefreshTokenUseCase = {
      execute: jest.fn(),
    };
    mockVerifyEmailUseCase = {
      execute: jest.fn(),
    };
    mockResendVerificationEmailUseCase = {
      execute: jest.fn(),
    };
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logBusinessEvent: jest.fn(),
      logSecurityEvent: jest.fn(),
      logPerformanceEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: 'RegisterUserUseCase',
          useValue: mockRegisterUserUseCase,
        },
        {
          provide: 'LoginUserUseCase',
          useValue: mockLoginUserUseCase,
        },
        {
          provide: 'RefreshTokenUseCase',
          useValue: mockRefreshTokenUseCase,
        },
        {
          provide: 'VerifyEmailUseCase',
          useValue: mockVerifyEmailUseCase,
        },
        {
          provide: 'ResendVerificationEmailUseCase',
          useValue: mockResendVerificationEmailUseCase,
        },
        {
          provide: 'Logger',
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const registerDto: RegisterUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockResponse = {
        user: {
          id: 'user-id',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        message:
          'Registration successful. Please check your email to verify your account.',
      };

      mockRegisterUserUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        id: mockResponse.user.id,
        name: mockResponse.user.name,
        email: mockResponse.user.email,
        createdAt: mockResponse.user.createdAt,
        message: mockResponse.message,
      });

      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        name: registerDto.name,
        email: registerDto.email,
        password: registerDto.password,
      });
    });

    it('should throw BadRequestException when user already exists', async () => {
      const registerDto: RegisterUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      mockRegisterUserUseCase.execute.mockRejectedValue(
        new Error('User already exists'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.register(registerDto)).rejects.toThrow(
        'User already exists',
      );
    });

    it('should throw BadRequestException for other registration errors', async () => {
      const registerDto: RegisterUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      mockRegisterUserUseCase.execute.mockRejectedValue(
        new Error('Some other error'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.register(registerDto)).rejects.toThrow(
        'User registration failed',
      );
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      const loginDto: LoginUserDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockResponse = {
        user: {
          id: 'user-id',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      mockLoginUserUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        user: {
          id: mockResponse.user.id,
          name: mockResponse.user.name,
          email: mockResponse.user.email,
        },
        tokens: {
          accessToken: mockResponse.tokens.accessToken,
          refreshToken: mockResponse.tokens.refreshToken,
          expiresIn: 900,
        },
      });

      expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith({
        email: loginDto.email,
        password: loginDto.password,
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginUserDto = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      mockLoginUserUseCase.execute.mockRejectedValue(
        new Error('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException when email is not verified', async () => {
      const loginDto: LoginUserDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      mockLoginUserUseCase.execute.mockRejectedValue(
        new Error(
          'Email not verified. Please check your email and verify your account.',
        ),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Email not verified',
      );
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'valid-refresh-token',
      };

      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockRefreshTokenUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual({
        accessToken: mockResponse.accessToken,
        expiresIn: 900,
      });

      expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledWith({
        refreshToken: refreshTokenDto.refreshToken,
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'invalid-refresh-token',
      };

      mockRefreshTokenUseCase.execute.mockRejectedValue(
        new Error('Invalid refresh token'),
      );

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        token: 'valid-verification-token',
      };

      const mockResponse = {
        success: true,
        message: 'E-mail verificado com sucesso!',
      };

      mockVerifyEmailUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.verifyEmail(verifyEmailDto);

      expect(result).toEqual(mockResponse);
      expect(mockVerifyEmailUseCase.execute).toHaveBeenCalledWith({
        token: verifyEmailDto.token,
      });
    });

    it('should throw BadRequestException for invalid token', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        token: 'invalid-token',
      };

      mockVerifyEmailUseCase.execute.mockRejectedValue(
        new Error('Invalid verification token'),
      );

      await expect(controller.verifyEmail(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.verifyEmail(verifyEmailDto)).rejects.toThrow(
        'Invalid verification token',
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        token: 'expired-token',
      };

      mockVerifyEmailUseCase.execute.mockRejectedValue(
        new Error('Verification token has expired'),
      );

      await expect(controller.verifyEmail(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email successfully', async () => {
      const resendVerificationDto: ResendVerificationDto = {
        email: 'john@example.com',
      };

      const mockResponse = {
        success: true,
        message: 'E-mail de verificação reenviado com sucesso!',
      };

      mockResendVerificationEmailUseCase.execute.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.resendVerification(resendVerificationDto);

      expect(result).toEqual(mockResponse);
      expect(mockResendVerificationEmailUseCase.execute).toHaveBeenCalledWith({
        email: resendVerificationDto.email,
      });
    });

    it('should throw BadRequestException when resend fails', async () => {
      const resendVerificationDto: ResendVerificationDto = {
        email: 'john@example.com',
      };

      mockResendVerificationEmailUseCase.execute.mockRejectedValue(
        new Error('Failed to send verification email'),
      );

      await expect(
        controller.resendVerification(resendVerificationDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.resendVerification(resendVerificationDto),
      ).rejects.toThrow('Failed to resend verification email');
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors in register', async () => {
      const registerDto: RegisterUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      mockRegisterUserUseCase.execute.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle unexpected errors in login', async () => {
      const loginDto: LoginUserDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      mockLoginUserUseCase.execute.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle unexpected errors in refresh', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'valid-refresh-token',
      };

      mockRefreshTokenUseCase.execute.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
