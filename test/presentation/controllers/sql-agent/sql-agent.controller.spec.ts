import { Test } from '@nestjs/testing';
import { SqlAgentController } from '@/presentation/controllers/sql-agent.controller';

describe('SqlAgentController', () => {
  it('should call orchestrate and map response', async () => {
    const orchestrate = {
      execute: jest.fn().mockResolvedValue({
        approvedQuery: { sql: 'SELECT 1', params: [] },
        rows: [{ x: 1 }],
        answer: 'ok',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [SqlAgentController],
      providers: [
        { provide: 'OrchestrateSqlAnswerUseCase', useValue: orchestrate },
      ],
    }).compile();

    const controller = moduleRef.get(SqlAgentController);

    const dto = { question: 'quanto tenho que pagar?' } as any;
    const user = { id: 'user-1' } as any;
    const res = await controller.ask(dto, user);

    expect(orchestrate.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      question: 'quanto tenho que pagar?',
    });
    expect(res).toEqual({ sql: 'SELECT 1', rows: [{ x: 1 }], answer: 'ok' });
  });
});
