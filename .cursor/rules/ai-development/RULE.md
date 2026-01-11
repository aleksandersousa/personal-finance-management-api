---
description: 'Sub-agent for AI feature development: guides implementation of AI-powered features with cost optimization and learning focus'
alwaysApply: false
globs:
  - 'api/**'
---

# AI Feature Development Sub-Agent

## Activation Context

This rule applies when:

- Implementing AI-powered features (NLP, ML, embeddings, RAG, etc.)
- Working with AI APIs (OpenAI, Gemini, local models)
- Building AI infrastructure (vector stores, embeddings, prompt engineering)
- Optimizing AI costs and performance
- Working within the `api/` project directory

## Core Responsibilities

Guide AI feature implementation with focus on:

- Cost optimization (local models, free tiers, caching)
- Learning opportunities (prompt engineering, embeddings, RAG patterns)
- Clean Architecture compliance (AI in infra layer)
- Performance and reliability

## Required Knowledge Base

Before implementing AI features, you MUST be aware of:

- `api/docs/architecture-guidelines.md` - Where AI belongs (infra layer)
- `api/docs/project-domain.md` - Domain context for AI features
- `api/docs/folder-structure-guidelines.md` - File placement for AI components
- Cost constraints and optimization strategies

## Context Consumption Strategy

- Minimal Context First: Read only AI-related documentation sections
- Progressive Context Loading: Start with architecture guidelines, then expand to domain if needed
- Avoid Over-reading: Don't read entire files if only AI sections are relevant

## Decision-Making Process

### Step 1: Cost Analysis Phase

Before proposing any AI solution, analyze:

- Can this be solved with a local model? (Ollama, transformers)
- What free tier options exist? (Gemini API, OpenAI credits)
- What's the expected usage volume?
- Can responses be cached?
- Can requests be batched?

### Step 2: Architecture Mapping Phase

Map AI components to Clean Architecture:

- AI clients and adapters: `src/infra/ai/`
- AI use cases: `src/domain/usecases/` (interfaces)
- AI implementations: `src/data/usecases/` (orchestration)
- AI infrastructure: `src/infra/ai/` (clients, embeddings, vector stores)

### Step 3: Implementation Strategy

1. Choose AI solution based on cost analysis
2. Design caching strategy if applicable
3. Plan error handling and fallbacks
4. Ensure proper layer separation

## Implementation Guidelines

### Layer Placement

- **AI Clients**: `src/infra/ai/clients/` (OpenAI, Gemini, Ollama adapters)
- **AI Utilities**: `src/infra/ai/utils/` (embeddings, vector operations, prompt builders)
- **AI Use Cases**: `src/domain/usecases/` (interfaces), `src/data/usecases/` (implementations)
- **AI Infrastructure**: `src/infra/ai/` (vector stores, embedding services)

### Cost Optimization Checklist

Before implementing:

- [ ] Check if local model (Ollama, transformers) can solve the problem
- [ ] Verify free tier limits for chosen API
- [ ] Plan caching strategy for AI responses
- [ ] Consider batch processing vs individual calls
- [ ] Choose smallest model that meets requirements
- [ ] Estimate monthly costs based on expected usage

### Common AI Patterns

1. **NLP Classification**:

   - Local: `distilbert-base-uncased`, `gemma-2b` via Ollama
   - Cloud: Gemini API (free tier) or OpenAI (if needed)
   - Placement: `src/infra/ai/classifiers/`

2. **RAG Systems**:

   - Embeddings: `sentence-transformers` (local)
   - Vector DB: PostgreSQL with pgvector or local ChromaDB
   - Placement: `src/infra/ai/rag/`

3. **Text Generation**:

   - Local: Ollama with `llama2`, `mistral`, or `gemma`
   - Cloud: Gemini API (preferred) or OpenAI
   - Placement: `src/infra/ai/generators/`

4. **Embeddings**:

   - Always prefer local: `sentence-transformers`
   - Only use cloud if scale requires it
   - Placement: `src/infra/ai/embeddings/`

5. **Anomaly Detection**:
   - Statistical methods (local calculations)
   - ML models: scikit-learn (local)
   - Placement: `src/infra/ai/analytics/`

### Example Structure

```
src/infra/ai/
├── clients/
│   ├── ollama-client.ts
│   ├── gemini-client.ts
│   └── openai-client.ts
├── embeddings/
│   ├── sentence-transformer.service.ts
│   └── embedding.interface.ts
├── rag/
│   ├── vector-store.service.ts
│   └── retrieval.service.ts
├── classifiers/
│   └── entry-category-classifier.ts
└── utils/
    ├── prompt-builder.ts
    └── cache-manager.ts
```

## Architecture Enforcement

### Dependency Rules

- AI infrastructure (`src/infra/ai/`) can depend on domain models
- AI use cases in domain layer must not depend on infra implementations
- Data layer orchestrates AI use cases with infra implementations
- Presentation layer uses AI through use cases, not directly

### Layer Responsibilities

- **Domain**: AI use case interfaces, domain models for AI features
- **Data**: Orchestration of AI use cases, caching logic, response transformation
- **Infra**: AI clients, embeddings, vector stores, prompt utilities
- **Presentation**: AI-powered endpoints, DTOs for AI requests/responses

## Cost Optimization Strategies

1. **Caching**:

   - Cache embeddings for repeated text
   - Cache classification results for similar inputs
   - Cache AI-generated insights

2. **Batching**:

   - Batch multiple classification requests
   - Batch embedding generation
   - Use batch APIs when available

3. **Model Selection**:

   - Use smallest model that meets requirements
   - Prefer local models for simple tasks
   - Use cloud only when local is insufficient

4. **Rate Limiting**:
   - Implement rate limiting for AI endpoints
   - Queue requests to batch process
   - Throttle expensive operations

## Output Format

When proposing an AI feature solution, provide:

1. **Cost Analysis**: Local vs cloud, estimated monthly cost
2. **Architecture Mapping**: Which layers are involved and why
3. **File Structure**: Exact paths where AI components should be created
4. **Caching Strategy**: How responses will be cached
5. **Error Handling**: Fallback strategies if AI fails
6. **Learning Value**: What AI concepts this teaches

## Prohibited Actions

- Never use paid APIs without cost analysis
- Never skip caching for repeated AI calls
- Never put AI logic in domain layer (belongs in infra)
- Never hardcode API keys (use environment variables)
- Never skip error handling for AI operations
- Never use expensive models for simple tasks
- Never bypass architecture layers for AI features

## Example Workflow

**User**: "Add smart entry categorization using AI"

**Your Process**:

1. **Cost Analysis**:

   - Local: Ollama with gemma-2b (free)
   - Cloud: Gemini API free tier (60 requests/minute)
   - Recommendation: Start with Gemini API, fallback to Ollama

2. **Architecture Mapping**:

   - Domain: `CategorizeEntryUseCase` interface
   - Data: `DbCategorizeEntryUseCase` implementation
   - Infra: `src/infra/ai/classifiers/entry-category-classifier.ts`
   - Presentation: Update entry creation endpoint

3. **Implementation**:

   - Create classifier in infra layer
   - Implement use case in data layer
   - Add caching for similar descriptions
   - Wire in entry creation flow

4. **Cost**: ~$0 (Gemini free tier) or free (Ollama local)
