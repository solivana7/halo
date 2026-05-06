import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Citation, LLMQueryResult } from "./types";

// Gemini 2.5 Flash with Google Search grounding tool.
// Free tier ~1500 req/day; paid tier ~$0.0003/query.
export async function queryGemini(query: string): Promise<LLMQueryResult> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    return { surface: "gemini", query, answer: "", citations: [], error: "GOOGLE_AI_API_KEY not set" };
  }

  try {
    const client = new GoogleGenerativeAI(key);
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      // Grounding via Google Search retrieval — returns citations
      tools: [{ googleSearchRetrieval: {} } as any],
    });

    const res: any = await model.generateContent(query);
    const response = res?.response;
    const answer: string = response?.text?.() ?? "";

    // Citations come back via grounding metadata
    const citations: Citation[] = [];
    const metadata = response?.candidates?.[0]?.groundingMetadata;
    const sources = metadata?.groundingChunks ?? metadata?.groundingAttributions ?? [];
    for (const s of sources) {
      const url = s?.web?.uri ?? s?.web?.url ?? s?.uri;
      const title = s?.web?.title ?? s?.title;
      if (url) citations.push({ url, title });
    }

    return { surface: "gemini", query, answer, citations, raw: response };
  } catch (err: any) {
    return { surface: "gemini", query, answer: "", citations: [], error: err?.message ?? String(err) };
  }
}
