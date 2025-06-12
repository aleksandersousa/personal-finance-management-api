import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsEmail } from "class-validator";

export class LoginUserDto {
  @ApiProperty({
    description: "User email address",
    example: "john.doe@example.com",
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "User password",
    example: "securePassword123",
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
