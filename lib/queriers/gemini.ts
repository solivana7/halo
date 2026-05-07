import type { Citation, LLMQueryResult } from "./types";

// Direct REST call to the Gemini API — we bypass the @google/generative-ai
// SDK because at v0.30 it serializes the grounding tool name in a way
// that's been deprecated. Google replaced `google_search_retrieval` with
// `google_search` for Gemini 2.0+ models, and 1.5 models are no longer
// available on new API projects (404 Not Found). This direct path lets
// us send the exact request shape the v1beta API expects.
//
// Override the model with `GEMINI_MODEL` env var. Default routes to
// whatever's current; the alias picks the API's recommended free-tier
// flash model (2.5 currently as of mid-2025).
const DEFAULT_MODEL = "gemini-flash-latest";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
    };
  }>;
};

export async function queryGemini(query: string): Promise<LLMQueryResult> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    return { surface: "gemini", query, answer: "", citations: [], error: "GOOGLE_AI_API_KEY not set" };
  }

  const modelName = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const url = `${API_BASE}/${modelName}:generateContent`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: query }] }],
        // The current grounding tool for Gemini 2.0+. The API rejects
        // `google_search_retrieval` on these models. snake_case here is
        // intentional — that's the wire format.
        tools: [{ google_search: {} }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[gemini] http error", { model: modelName, status: res.status, body: text.slice(0, 500) });
      return { surface: "gemini", query, answer: "", citations: [], error: `${res.status} ${text}` };
    }

    const data = (await res.json()) as GeminiResponse;
    const candidate = data?.candidates?.[0];
    const answer = (candidate?.content?.parts ?? [])
      .map((p) => p?.text ?? "")
      .join("");

    const citations: Citation[] = [];
    for (const chunk of candidate?.groundingMetadata?.groundingChunks ?? []) {
      const url = chunk?.web?.uri;
      const title = chunk?.web?.title;
      if (url) citations.push({ url, title });
    }

    return { surface: "gemini", query, answer, citations, raw: data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[gemini] query failed:", { model: modelName, error: msg });
    return { surface: "gemini", query, answer: "", citations: [], error: msg };
  }
}
