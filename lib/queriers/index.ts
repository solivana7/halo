import { queryPerplexity } from "./perplexity";
import { queryClaude } from "./claude";
import { queryOpenAI } from "./openai";
import type { LLMQueryResult, Querier } from "./types";

export const QUERIERS: Record<string, Querier> = {
  perplexity: queryPerplexity,
  claude: queryClaude,
  openai: queryOpenAI,
};

export const SURFACE_LABELS: Record<string, string> = {
  perplexity: "Perplexity",
  claude: "Claude",
  openai: "ChatGPT",
};

export type { LLMQueryResult };
