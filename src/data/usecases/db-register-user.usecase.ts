import {
  RegisterUserUseCase,
  RegisterUserRequest,
  RegisterUserResponse,
} from "@domain/usecases/register-user.usecase";
import { UserRepository } from "../protocols/user-repository";
import { Hasher } from "../protocols/hasher";
import { TokenGenerator } from "../protocols/token-generator";

export class DbRegisterUserUseCase implements RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: Hasher,
    private readonly tokenGenerator: TokenGenerator
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new Error("Invalid email format");
    }

    // Validate password strength
    if (request.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Validate name
    if (!request.name || request.name.trim().length === 0) {
      throw new Error("Name is required");
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Hash password
    const hashedPassword = await this.hasher.hash(request.password);

    // Create user
    const user = await this.userRepository.create({
      name: request.name.trim(),
      email: request.email.toLowerCase(),
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = await this.tokenGenerator.generateTokens({
      userId: user.id,
      email: user.email,
    });

    // Return response without password
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
