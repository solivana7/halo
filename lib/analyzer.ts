import type { LLMQueryResult } from "./queriers/types";

export type CitationAnalysis = {
  cited: boolean;
  position: number | null;       // 1-indexed position in numbered list, if any
  brandUrlCited: boolean;        // brand domain appears in returned citations
  competitorsMentioned: string[];
  excerpt?: string;              // sentence around the brand mention
};

export type BrandIdentity = {
  brand: string;
  domain?: string;               // e.g. "solivana.com" — matched against citation URLs
  aliases?: string[];            // alt brand names
};

const NUMBERED_ITEM_RE = /^\s*(\d+)[\.\)]\s+(.+)$/gm;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function analyzeResult(
  result: LLMQueryResult,
  brand: BrandIdentity,
  competitors: string[] = []
): CitationAnalysis {
  const text = result.answer ?? "";
  const names = [brand.brand, ...(brand.aliases ?? [])].filter(Boolean);
  const brandRe = new RegExp(`\\b(${names.map(escapeRegex).join("|")})\\b`, "i");
  const cited = brandRe.test(text);

  // Find position in any numbered list
  let position: number | null = null;
  const matches = [...text.matchAll(NUMBERED_ITEM_RE)];
  for (const m of matches) {
    if (brandRe.test(m[2])) {
      position = parseInt(m[1], 10);
      break;
    }
  }

  // Brand URL in citations?
  const brandUrlCited =
    !!brand.domain &&
    result.citations.some((c) => stripDomain(c.url).includes(brand.domain!.toLowerCase()));

  // Which competitors got name-checked?
  const competitorsMentioned: string[] = [];
  for (const comp of competitors) {
    const re = new RegExp(`\\b${escapeRegex(comp)}\\b`, "i");
    if (re.test(text)) competitorsMentioned.push(comp);
  }

  // Sentence around brand mention
  let excerpt: string | undefined;
  if (cited) {
    const idx = text.search(brandRe);
    const start = Math.max(0, text.lastIndexOf(".", idx) + 1);
    const dotEnd = text.indexOf(".", idx);
    const end = dotEnd === -1 ? Math.min(text.length, idx + 200) : dotEnd + 1;
    excerpt = text.slice(start, end).trim();
  }

  return { cited, position, brandUrlCited, competitorsMentioned, excerpt };
}
