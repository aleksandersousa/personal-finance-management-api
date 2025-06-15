import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../../../src/presentation/controllers/auth.controller';
import { RegisterUserUseCase } from '../../../src/domain/usecases/register-user.usecase';
import { LoginUserUseCase } from '../../../src/domain/usecases/login-user.usecase';
import { RefreshTokenUseCase } from '../../../src/domain/usecases/refresh-token.usecase';
import { RegisterUserDto } from '../../../src/presentation/dtos/register-user.dto';
import { LoginUserDto } from '../../../src/presentation/dtos/login-user.dto';
import { RefreshTokenDto } from '../../../src/presentation/dtos/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockRegisterUserUseCase: jest.Mocked<RegisterUserUseCase>;
  let mockLoginUserUseCase: jest.Mocked<LoginUserUseCase>;
  let mockRefreshTokenUseCase: jest.Mocked<RefreshTokenUseCase>;

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
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      mockRegisterUserUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        id: mockResponse.user.id,
        name: mockResponse.user.name,
        email: mockResponse.user.email,
        createdAt: mockResponse.user.createdAt,
        tokens: {
          accessToken: mockResponse.tokens.accessToken,
          refreshToken: mockResponse.tokens.refreshToken,
          expiresIn: 900,
        },
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
