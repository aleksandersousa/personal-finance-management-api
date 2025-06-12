import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
} from "class-validator";

export class RegisterUserDto {
  @ApiProperty({
    description: "User full name",
    example: "John Doe",
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

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
    minLength: 6,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
