import { AgentBasedOrchestrateSqlAnswer } from '@/data/usecases';
import { makeGeminiAgent } from '@main/factories/providers/sql-agent/gemini-agent.factory';
import { makeGeminiSummarizer } from '@main/factories/providers/sql-agent/gemini-summarizer.factory';

export function makeAgentBasedOrchestrateAnswerFactory() {
  const agent = makeGeminiAgent();
  const summarizer = makeGeminiSummarizer();
  return new AgentBasedOrchestrateSqlAnswer(agent, summarizer);
}
