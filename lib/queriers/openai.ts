import OpenAI from "openai";
import type { Citation, LLMQueryResult } from "./types";

// ChatGPT (gpt-4o) with web_search tool via Responses API.
export async function queryOpenAI(query: string): Promise<LLMQueryResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return { surface: "openai", query, answer: "", citations: [], error: "OPENAI_API_KEY not set" };
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const res: any = await (client as any).responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search_preview" }],
      input: query,
    });

    const answer: string = res?.output_text ?? "";
    const citations: Citation[] = [];
    for (const item of res?.output ?? []) {
      if (item?.type === "message") {
        for (const c of item?.content ?? []) {
          for (const ann of c?.annotations ?? []) {
            if (ann?.type === "url_citation" && ann?.url) {
              citations.push({ url: ann.url, title: ann.title });
            }
          }
        }
      }
    }
    return { surface: "openai", query, answer, citations, raw: res };
  } catch (err: any) {
    return { surface: "openai", query, answer: "", citations: [], error: err?.message ?? String(err) };
  }
}
