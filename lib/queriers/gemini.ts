import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Citation, LLMQueryResult } from "./types";

// Gemini grounding tool name changed across model generations:
//   - Gemini 1.5 (flash, pro): `googleSearchRetrieval` (legacy)
//   - Gemini 2.0+ (flash, pro): `googleSearch` (current)
// The `gemini-flash-latest` alias routes to a 2.0+ model — passing
// `googleSearchRetrieval` to a 2.0+ model gets rejected by the API
// silently (the result returns empty answer + citations, which the
// dashboard then filters out as "no answer"). Pin to `gemini-1.5-flash`
// by default for stable grounding; auto-pick the right tool name based
// on the configured model.
//
// To switch to a 2.0+ model with grounding, set on Railway:
//   GEMINI_MODEL=gemini-2.5-flash      (any 2.0+ model)
const DEFAULT_MODEL = "gemini-1.5-flash";

function isGemini2OrNewer(model: string): boolean {
  // `gemini-2.0-...`, `gemini-2.5-...`, `gemini-3-...`. The `flash-latest`
  // and `pro-latest` aliases also route to 2.0+ models as of late 2025.
  return /\bgemini-(2|3|flash-latest|pro-latest)\b/i.test(model);
}

export async function queryGemini(query: string): Promise<LLMQueryResult> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    return { surface: "gemini", query, answer: "", citations: [], error: "GOOGLE_AI_API_KEY not set" };
  }

  try {
    const client = new GoogleGenerativeAI(key);
    // Defensive: GEMINI_MODEL env var has caused issues (stale value
    // routing to a 2.0+ model the installed SDK can't pass `googleSearch`
    // to). Override any env value pointing at flash-latest/2.x/3.x
    // to the known-working 1.5-flash + googleSearchRetrieval combo.
    let modelName = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
    if (isGemini2OrNewer(modelName)) {
      console.warn("[gemini] env model", modelName, "needs newer SDK. Forcing", DEFAULT_MODEL);
      modelName = DEFAULT_MODEL;
    }
    const groundingTool = { googleSearchRetrieval: {} };

    const model = client.getGenerativeModel({
      model: modelName,
      tools: [groundingTool as never],
    });

    const res: { response?: unknown } = await model.generateContent(query);
    const response = res?.response as
      | {
          text?: () => string;
          candidates?: Array<{
            groundingMetadata?: {
              groundingChunks?: Array<{ web?: { uri?: string; url?: string; title?: string } }>;
              groundingAttributions?: Array<{ web?: { uri?: string; url?: string; title?: string } }>;
            };
          }>;
        }
      | undefined;
    const answer: string = response?.text?.() ?? "";

    // Citations come back via grounding metadata. Both the v1.5
    // `groundingAttributions` and the v2.0 `groundingChunks` shapes work.
    const citations: Citation[] = [];
    const metadata = response?.candidates?.[0]?.groundingMetadata;
    const sources = metadata?.groundingChunks ?? metadata?.groundingAttributions ?? [];
    for (const s of sources) {
      const url = s?.web?.uri ?? s?.web?.url;
      const title = s?.web?.title;
      if (url) citations.push({ url, title });
    }

    return { surface: "gemini", query, answer, citations, raw: response };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Log to Railway logs — the dashboard filters result.error rows
    // silently, so without this console.error we couldn't diagnose
    // why the Gemini column shows "no answer" for every query.
    console.error("[gemini] query failed:", { model: process.env.GEMINI_MODEL ?? DEFAULT_MODEL, error: msg });
    return { surface: "gemini", query, answer: "", citations: [], error: msg };
  }
}
