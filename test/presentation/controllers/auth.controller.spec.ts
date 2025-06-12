import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "@presentation/controllers/auth.controller";
import { RegisterUserUseCase } from "@domain/usecases/register-user.usecase";
import { LoginUserUseCase } from "@domain/usecases/login-user.usecase";
import { RefreshTokenUseCase } from "@domain/usecases/refresh-token.usecase";

describe("AuthController", () => {
  let controller: AuthController;
  let registerUserUseCase: RegisterUserUseCase;
  let loginUserUseCase: LoginUserUseCase;
  let refreshTokenUseCase: RefreshTokenUseCase;

  const mockRegisterUserUseCase = {
    execute: jest.fn(),
  };

  const mockLoginUserUseCase = {
    execute: jest.fn(),
  };

  const mockRefreshTokenUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: "RegisterUserUseCase",
          useValue: mockRegisterUserUseCase,
        },
        {
          provide: "LoginUserUseCase",
          useValue: mockLoginUserUseCase,
        },
        {
          provide: "RefreshTokenUseCase",
          useValue: mockRefreshTokenUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    registerUserUseCase = module.get<RegisterUserUseCase>(
      "RegisterUserUseCase"
    );
    loginUserUseCase = module.get<LoginUserUseCase>("LoginUserUseCase");
    refreshTokenUseCase = module.get<RefreshTokenUseCase>(
      "RefreshTokenUseCase"
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const registerDto = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const mockResponse = {
        user: {
          id: "123",
          name: "Test User",
          email: "test@example.com",
          avatarUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      mockRegisterUserUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        user: mockResponse.user,
        accessToken: mockResponse.accessToken,
        refreshToken: mockResponse.refreshToken,
      });
      expect(registerUserUseCase.execute).toHaveBeenCalledWith(registerDto);
    });
  });

  describe("login", () => {
    it("should login user successfully", async () => {
      const loginDto = {
        email: "test@example.com",
        password: "password123",
      };

      const mockResponse = {
        user: {
          id: "123",
          name: "Test User",
          email: "test@example.com",
          avatarUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      mockLoginUserUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        user: mockResponse.user,
        accessToken: mockResponse.accessToken,
        refreshToken: mockResponse.refreshToken,
      });
      expect(loginUserUseCase.execute).toHaveBeenCalledWith(loginDto);
    });
  });

  describe("refresh", () => {
    it("should refresh tokens successfully", async () => {
      const refreshTokenDto = {
        refreshToken: "valid-refresh-token",
      };

      const mockResponse = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };

      mockRefreshTokenUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual({
        accessToken: mockResponse.accessToken,
        refreshToken: mockResponse.refreshToken,
      });
      expect(refreshTokenUseCase.execute).toHaveBeenCalledWith({
        refreshToken: "valid-refresh-token",
      });
    });
  });
});
