import { queryPerplexity } from "./perplexity";
import { queryClaude } from "./claude";
import { queryOpenAI } from "./openai";
import { queryGemini } from "./gemini";
import type { LLMQueryResult, Querier } from "./types";

export const QUERIERS: Record<string, Querier> = {
  perplexity: queryPerplexity,
  claude: queryClaude,
  openai: queryOpenAI,
  gemini: queryGemini,
};

export const SURFACE_LABELS: Record<string, string> = {
  perplexity: "Perplexity",
  claude: "Claude",
  openai: "ChatGPT",
  gemini: "Gemini",
};

export const SURFACE_ENV_VARS: Record<string, string> = {
  perplexity: "PERPLEXITY_API_KEY",
  claude: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  gemini: "GOOGLE_AI_API_KEY",
};

export const ALL_SURFACES = ["perplexity", "claude", "openai", "gemini"] as const;
export type Surface = typeof ALL_SURFACES[number];

export type { LLMQueryResult };
