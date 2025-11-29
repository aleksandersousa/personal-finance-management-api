import { Module } from '@nestjs/common';
import { SqlAgentController } from '@presentation/controllers/sql-agent.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { makeAgentBasedOrchestrateAnswerFactory } from '@/main/factories/usecases/sql-agent';
import { AuthModule } from './auth.module';
import { ObservabilityModule } from './observability.module';

@Module({
  imports: [AuthModule, ObservabilityModule, TypeOrmModule.forFeature([])],
  controllers: [SqlAgentController],
  providers: [
    {
      provide: 'OrchestrateSqlAnswerUseCase',
      useFactory: makeAgentBasedOrchestrateAnswerFactory,
    },
  ],
  exports: ['OrchestrateSqlAnswerUseCase'],
})
export class SqlAgentModule {}
