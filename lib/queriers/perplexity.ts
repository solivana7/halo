import type { LLMQueryResult } from "./types";

// Perplexity: native citations come back in the response.
// Cheapest of the four LLM surfaces (~$0.005/query on sonar-pro).
export async function queryPerplexity(query: string): Promise<LLMQueryResult> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) {
    return { surface: "perplexity", query, answer: "", citations: [], error: "PERPLEXITY_API_KEY not set" };
  }

  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [{ role: "user", content: query }],
        return_citations: true,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { surface: "perplexity", query, answer: "", citations: [], error: `${res.status} ${text}` };
    }
    const data: any = await res.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";
    const urls: string[] = data?.citations ?? [];
    return {
      surface: "perplexity",
      query,
      answer,
      citations: urls.map((url) => ({ url })),
      raw: data,
    };
  } catch (err: any) {
    return { surface: "perplexity", query, answer: "", citations: [], error: err?.message ?? String(err) };
  }
}
