import Anthropic from "@anthropic-ai/sdk";
import type { Citation, LLMQueryResult } from "./types";

// Claude with web_search tool. Returns answer + citations from web search results.
export async function queryClaude(query: string): Promise<LLMQueryResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { surface: "claude", query, answer: "", citations: [], error: "ANTHROPIC_API_KEY not set" };
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const res: any = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      tools: [{ type: "web_search_20250305" as any, name: "web_search", max_uses: 5 } as any],
      messages: [{ role: "user", content: query }],
    });

    let answer = "";
    const citations: Citation[] = [];
    for (const block of res.content ?? []) {
      if (block.type === "text") {
        answer += block.text;
        for (const c of block.citations ?? []) {
          if (c?.url) citations.push({ url: c.url, title: c.title, snippet: c.cited_text });
        }
      }
    }

    return { surface: "claude", query, answer, citations, raw: res };
  } catch (err: any) {
    return { surface: "claude", query, answer: "", citations: [], error: err?.message ?? String(err) };
  }
}
