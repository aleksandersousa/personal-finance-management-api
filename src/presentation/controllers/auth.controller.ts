import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RegisterUserUseCase } from '@domain/usecases/register-user.usecase';
import { LoginUserUseCase } from '@domain/usecases/login-user.usecase';
import { RefreshTokenUseCase } from '@domain/usecases/refresh-token.usecase';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { LoginUserDto } from '../dtos/login-user.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
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
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: 900, // 15 minutes
        },
      };
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw new BadRequestException('User already exists');
      }
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
      throw new UnauthorizedException('Invalid credentials');
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
}
