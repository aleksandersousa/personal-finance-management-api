import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AskSqlDto, SqlAgentResponseDto } from '@/presentation/dtos';
import { OrchestrateSqlAnswer } from '@/domain/usecases/orchestrate-sql-answer';
import { User } from '../decorators/user.decorator';
import type { UserPayload } from '@/domain/models/user.model';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class SqlAgentController {
  constructor(
    @Inject('OrchestrateSqlAnswerUseCase')
    private readonly orchestrate: OrchestrateSqlAnswer,
  ) {}

  @ApiOperation({
    summary: 'Enviar uma pergunta para o SQL Agent',
    description:
      'Gera e executa uma consulta SQL com base em uma pergunta em linguagem natural do usuário autenticado e retorna a resposta explicada.',
  })
  @ApiResponse({
    status: 201,
    description: 'SQL Agent response',
    type: SqlAgentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed or invalid data' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiBody({ type: AskSqlDto })
  @Post('sql')
  async ask(@Body(ValidationPipe) body: AskSqlDto, @User() user: UserPayload) {
    try {
      const result = await this.orchestrate.execute({
        userId: user.id,
        question: body.question,
      });
      return {
        sql: result.approvedQuery.sql,
        rows: result.rows,
        answer: result.answer,
      };
    } catch (error) {
      const message =
        (error && error.message) || 'Falha ao processar a pergunta';
      throw new BadRequestException(message);
    }
  }
}
