import type { UserRepository } from '@/data/protocols';
import { JwtStrategy } from '@/presentation/strategies/jwt.strategy';
import type { ConfigService } from '@nestjs/config';

export const makeJwtStrategyFactory = (
  configService: ConfigService,
  useRepository: UserRepository,
) => {
  return new JwtStrategy(configService, useRepository);
};
