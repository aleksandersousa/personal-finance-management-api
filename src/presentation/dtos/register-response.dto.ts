import { ApiProperty } from "@nestjs/swagger";

export class TokensDto {
  @ApiProperty({
    description: "JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  accessToken: string;

  @ApiProperty({
    description: "JWT refresh token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  refreshToken: string;

  @ApiProperty({
    description: "Token expiration time in seconds",
    example: 900,
  })
  expiresIn: number;
}

export class RegisterResponseDto {
  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "User full name",
    example: "John Doe",
  })
  name: string;

  @ApiProperty({
    description: "User email address",
    example: "john.doe@example.com",
  })
  email: string;

  @ApiProperty({
    description: "User creation date",
    example: "2025-01-15T10:00:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Authentication tokens",
    type: TokensDto,
  })
  tokens: TokensDto;
}
