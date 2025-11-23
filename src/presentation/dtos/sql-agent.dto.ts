import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskSqlDto {
  @ApiProperty({
    description: 'Pergunta em linguagem natural para o agente SQL',
    example: 'Qual foi meu gasto total com supermercado em março de 2025?',
    minLength: 3,
    maxLength: 500,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question: string;

  @ApiProperty({
    description:
      'Se verdadeiro, habilita streaming de resposta (quando suportado)',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}

export class SqlAgentResponseDto {
  @ApiProperty({
    description: 'Consulta SQL aprovada pelo agente',
    example:
      "SELECT c.name, SUM(e.amount) AS total FROM entries e JOIN categories c ON c.id = e.category_id WHERE e.user_id = :userId AND e.type = 'EXPENSE' AND DATE_TRUNC('month', e.date) = DATE '2025-03-01' GROUP BY c.name ORDER BY total DESC;",
  })
  @IsString()
  sql: string;

  @ApiProperty({
    description: 'Linhas retornadas pela execução da consulta',
    type: [Object],
    example: [{ category: 'Supermercado', total: 842.75 }],
  })
  rows: Array<Record<string, unknown>>;

  @ApiProperty({
    description: 'Resposta em linguagem natural gerada pelo agente',
    example: 'Você gastou R$ 842,75 em supermercado em março de 2025.',
  })
  @IsString()
  answer: string;
}
