import { LocalOrchestrateSqlAnswer } from '@/data/usecases/orchestrate-sql-answer';
import { makeSchemaSnapshotProvider } from '@main/factories/providers/sql-agent/schema-snapshot.factory';
import { makeOllamaSqlGenerator } from '@main/factories/providers/sql-agent/ollama-sql-generator.factory';
import { makeSqlValidator } from '@main/factories/providers/sql-agent/sql-validator.factory';
import { makeSqlExecutor } from '@main/factories/providers/sql-agent/sql-executor.factory';
import { makeOllamaSummarizer } from '@main/factories/providers/sql-agent/ollama-summarizer.factory';
import { DataSource } from 'typeorm';

export function makeOrchestrateSqlAnswerFactory(dataSource: DataSource) {
  const schemaProvider = makeSchemaSnapshotProvider(dataSource);
  const generator = makeOllamaSqlGenerator();
  const validator = makeSqlValidator();
  const executor = makeSqlExecutor(dataSource);
  const summarizer = makeOllamaSummarizer();
  return new LocalOrchestrateSqlAnswer(
    schemaProvider,
    generator,
    validator,
    executor,
    summarizer,
  );
}
