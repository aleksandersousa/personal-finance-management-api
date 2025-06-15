import { TypeormUserRepository } from "@infra/db/typeorm/repositories/typeorm-user.repository";
import { JwtTokenGenerator } from "@infra/implementations/jwt-token-generator";
import { UserEntity } from "@infra/db/typeorm/entities/user.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

// Factory para criar o repositório TypeORM
export const makeUserRepository = (
  repository: Repository<UserEntity>
): TypeormUserRepository => {
  return new TypeormUserRepository(repository);
};

// Factory para criar o token generator
export const makeTokenGenerator = (
  jwtService: JwtService,
  configService: ConfigService
): JwtTokenGenerator => {
  return new JwtTokenGenerator(jwtService, configService);
};
