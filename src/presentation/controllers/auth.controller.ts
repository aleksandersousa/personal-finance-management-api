import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
  Inject,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
} from "@nestjs/swagger";
import { RegisterUserUseCase } from "@domain/usecases/register-user.usecase";
import { LoginUserUseCase } from "@domain/usecases/login-user.usecase";
import { RefreshTokenUseCase } from "@domain/usecases/refresh-token.usecase";
import { RegisterUserDto } from "../dtos/register-user.dto";
import { LoginUserDto } from "../dtos/login-user.dto";
import { RefreshTokenDto } from "../dtos/refresh-token.dto";
import { AuthResponseDto } from "../dtos/auth-response.dto";
import { RefreshTokenResponseDto } from "../dtos/refresh-token-response.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    @Inject("RegisterUserUseCase")
    private readonly registerUserUseCase: RegisterUserUseCase,
    @Inject("LoginUserUseCase")
    private readonly loginUserUseCase: LoginUserUseCase,
    @Inject("RefreshTokenUseCase")
    private readonly refreshTokenUseCase: RefreshTokenUseCase
  ) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({
    status: 201,
    description: "User registered successfully",
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Validation failed or user already exists",
  })
  @ApiBody({ type: RegisterUserDto })
  async register(
    @Body() registerUserDto: RegisterUserDto
  ): Promise<AuthResponseDto> {
    try {
      const result = await this.registerUserUseCase.execute({
        name: registerUserDto.name,
        email: registerUserDto.email,
        password: registerUserDto.password,
      });

      return {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          avatarUrl: result.user.avatarUrl,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "User login" })
  @ApiResponse({
    status: 200,
    description: "User logged in successfully",
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid credentials",
  })
  @ApiBody({ type: LoginUserDto })
  async login(@Body() loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
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
          avatarUrl: result.user.avatarUrl,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh authentication token" })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully",
    type: RefreshTokenResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid or expired refresh token",
  })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<RefreshTokenResponseDto> {
    try {
      const result = await this.refreshTokenUseCase.execute({
        refreshToken: refreshTokenDto.refreshToken,
      });

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }
}
