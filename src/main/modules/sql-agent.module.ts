import { Module } from '@nestjs/common';
import { SqlAgentController } from '@presentation/controllers/sql-agent.controller';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import { makeOrchestrateSqlAnswerFactory } from '@main/factories/usecases/sql-agent/orchestrate-sql-answer.factory';
import { AuthModule } from './auth.module';
import { ObservabilityModule } from './observability.module';

@Module({
  imports: [AuthModule, ObservabilityModule, TypeOrmModule.forFeature([])],
  controllers: [SqlAgentController],
  providers: [
    {
      provide: 'OrchestrateSqlAnswerUseCase',
      useFactory: makeOrchestrateSqlAnswerFactory,
      inject: [getDataSourceToken()],
    },
  ],
  exports: ['OrchestrateSqlAnswerUseCase'],
})
export class SqlAgentModule {}
