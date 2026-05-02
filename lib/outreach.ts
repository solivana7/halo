// Aggregates "who's getting cited where you aren't"
// from a ScanRecord. Pure function — no I/O.

import type { ScanRecord } from "./storage";

export type OutreachHit = {
  query: string;
  surface: string;
  url: string;
  title?: string;
};

export type OutreachTarget = {
  domain: string;
  hits: OutreachHit[];
  topQueries: string[]; // unique queries this domain is cited for
  surfaces: string[]; // which AI surfaces cite this domain
};

function stripDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

// Domains that aren't useful outreach targets — they're the AIs themselves,
// social aggregators, government, or generic Wikipedia-style sources.
const SKIP_DOMAINS = new Set([
  "google.com",
  "youtube.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "wikipedia.org",
  "en.wikipedia.org",
  "amazon.com",
  "openai.com",
  "anthropic.com",
  "perplexity.ai",
  "perplexity.com",
  "chatgpt.com",
  "claude.ai",
]);

export function buildOutreachTargets(scan: ScanRecord, brandDomain?: string): OutreachTarget[] {
  const byDomain = new Map<string, OutreachTarget>();
  const brandHost = brandDomain
    ? stripDomain(brandDomain.startsWith("http") ? brandDomain : `https://${brandDomain}`)
    : null;

  for (const result of scan.results) {
    // Only mine queries where the brand was NOT cited
    if (result.cited || result.error) continue;
    if (!result.citations || result.citations.length === 0) continue;

    for (const citation of result.citations) {
      const domain = stripDomain(citation.url);
      if (!domain) continue;
      if (SKIP_DOMAINS.has(domain)) continue;
      if (brandHost && domain.includes(brandHost)) continue;

      let target = byDomain.get(domain);
      if (!target) {
        target = { domain, hits: [], topQueries: [], surfaces: [] };
        byDomain.set(domain, target);
      }
      target.hits.push({
        query: result.query,
        surface: result.surface,
        url: citation.url,
        title: citation.title,
      });
    }
  }

  // Compute top queries + surfaces per domain
  for (const target of byDomain.values()) {
    target.topQueries = Array.from(new Set(target.hits.map((h) => h.query)));
    target.surfaces = Array.from(new Set(target.hits.map((h) => h.surface)));
  }

  // Sort: most-cited domain first
  return Array.from(byDomain.values()).sort((a, b) => b.hits.length - a.hits.length);
}

// Build the prompt context Claude uses to draft a pitch
export function pitchContext(
  target: OutreachTarget,
  brand: string,
  city: string,
  region: string,
  serviceNames: string[]
): string {
  return [
    `Publisher domain: ${target.domain}`,
    `They are cited by ${target.surfaces.length === 1 ? target.surfaces[0] : target.surfaces.join(" and ")} on ${target.hits.length} ${target.hits.length === 1 ? "query" : "queries"}.`,
    ``,
    `Specific URLs of theirs that AI is citing:`,
    ...target.hits.slice(0, 5).map((h) => `- ${h.url}${h.title ? `  (${h.title})` : ""}  — for query "${h.query}"`),
    ``,
    `Brand we are pitching: ${brand}, located in ${city}, ${region}`,
    `Services we offer: ${serviceNames.join(", ")}`,
  ].join("\n");
}
