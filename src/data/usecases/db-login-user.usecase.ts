import {
  LoginUserUseCase,
  LoginUserRequest,
  LoginUserResponse,
} from "@domain/usecases/login-user.usecase";
import { UserRepository } from "../protocols/user-repository";
import { Hasher } from "../protocols/hasher";
import { TokenGenerator } from "../protocols/token-generator";

export class DbLoginUserUseCase implements LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: Hasher,
    private readonly tokenGenerator: TokenGenerator
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    // Validate input
    if (!request.email || !request.password) {
      throw new Error("Invalid credentials");
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(
      request.email.toLowerCase()
    );
    if (!user || !user.password) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await this.hasher.compare(
      request.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

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
