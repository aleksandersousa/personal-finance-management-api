import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
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
    description: "User avatar URL",
    example: "https://example.com/avatar.jpg",
    nullable: true,
  })
  avatarUrl?: string;

  @ApiProperty({
    description: "User creation date",
    example: "2025-01-15T10:00:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "User last update date",
    example: "2025-01-15T10:00:00Z",
  })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: "User information",
    type: UserResponseDto,
  })
  user: UserResponseDto;

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
}
