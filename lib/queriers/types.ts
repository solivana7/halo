export type Citation = {
  title?: string;
  url: string;
  snippet?: string;
};

export type LLMQueryResult = {
  surface: "perplexity" | "claude" | "openai" | "gemini" | "google_aio";
  query: string;
  answer: string;
  citations: Citation[];
  raw?: unknown;
  error?: string;
};

export type Querier = (query: string) => Promise<LLMQueryResult>;
