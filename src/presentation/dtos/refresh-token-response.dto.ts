import { ApiProperty } from "@nestjs/swagger";

export class RefreshTokenResponseDto {
  @ApiProperty({
    description: "JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  accessToken: string;

  @ApiProperty({
    description: "Token expiration time in seconds",
    example: 900,
  })
  expiresIn: number;
}
