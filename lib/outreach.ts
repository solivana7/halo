// Aggregates "who's getting cited where you aren't" from a ScanRecord.
// Filters out: AI infrastructure URLs, social aggregators, the user's
// own brand domain, named competitors, and other-business sites whose
// domain matches a wellness-business pattern (likely competitor floats,
// spas, wellness centers).

import type { ScanRecord } from "./storage";

export type OutreachHit = {
  query: string;
  surface: string;
  url: string;
  title?: string;
};

export type OutreachKind = "publisher" | "competitor";

export type OutreachTarget = {
  domain: string;
  kind: OutreachKind; // publisher = real outreach target; competitor = SEO competitor (no pitch)
  hits: OutreachHit[];
  topQueries: string[];
  surfaces: string[];
  reason?: string; // why we classified it the way we did
};

function stripDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

// Hard-skip: AI infrastructure / aggregators / nothing-to-pitch domains.
// vertexaisearch.cloud.google.com is Gemini's grounding system reference,
// not a real publisher.
const SKIP_DOMAINS = new Set([
  "google.com",
  "vertexaisearch.cloud.google.com",
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
  "bing.com",
  "duckduckgo.com",
  "ai.google.dev",
]);

// Wellness-business domain hints. If a domain contains any of these
// strings, it's almost certainly a competing wellness business — not
// a publisher we'd pitch for inclusion. Marked as "competitor" instead
// of skipped so the user still sees the SEO landscape.
const COMPETITOR_DOMAIN_HINTS = [
  "float",
  "cryo",
  "wellness",
  "spa",
  "saunalounge",
  "redlight",
  "infrared",
  "iv-",
  "sauna",
  "biohack",
  "recovery",
  "rejuvenat",
  "restorat",
  "hyperbaric",
  "longevity",
  "regenerat",
  "rest",
  "relax",
];

// Known editorial / directory / publisher domains. If a domain is in
// here, it's a real outreach target regardless of any other heuristic.
const KNOWN_PUBLISHERS = new Set([
  "tripadvisor.com",
  "yelp.com",
  "thrillist.com",
  "wellandgood.com",
  "mindbodygreen.com",
  "vogue.com",
  "byrdie.com",
  "shape.com",
  "self.com",
  "outsideonline.com",
  "menshealth.com",
  "womenshealthmag.com",
  "thriveglobal.com",
  "forbes.com",
  "bloomberg.com",
  "sfmag.com",
  "sfist.com",
  "theboldistalic.com",
  "modernluxury.com",
]);

function classifyDomain(
  domain: string,
  competitorBrands: string[]
): { kind: OutreachKind; reason: string } {
  // Known publishers always pitchable
  if (KNOWN_PUBLISHERS.has(domain)) {
    return { kind: "publisher", reason: "Known editorial / review platform" };
  }

  // User-named competitor brand appears in the domain
  for (const brand of competitorBrands) {
    const slug = brand.toLowerCase().replace(/\W+/g, "");
    if (slug && domain.replace(/\W+/g, "").includes(slug)) {
      return { kind: "competitor", reason: `Matches your tracked competitor "${brand}"` };
    }
  }

  // Wellness-business naming pattern (heuristic, not a confirmed competitor)
  for (const hint of COMPETITOR_DOMAIN_HINTS) {
    if (domain.includes(hint)) {
      return { kind: "competitor", reason: `Domain contains "${hint}" — looks like another wellness business` };
    }
  }

  // Default: assume publisher
  return { kind: "publisher", reason: "Likely directory or editorial source" };
}

export function buildOutreachTargets(
  scan: ScanRecord,
  brandDomain?: string,
  competitorBrands: string[] = []
): OutreachTarget[] {
  const byDomain = new Map<string, OutreachTarget>();
  const brandHost = brandDomain
    ? stripDomain(brandDomain.startsWith("http") ? brandDomain : `https://${brandDomain}`)
    : null;

  for (const result of scan.results) {
    if (result.cited || result.error) continue;
    if (!result.citations || result.citations.length === 0) continue;

    for (const citation of result.citations) {
      const domain = stripDomain(citation.url);
      if (!domain) continue;
      if (SKIP_DOMAINS.has(domain)) continue;
      if (brandHost && domain.includes(brandHost)) continue;

      let target = byDomain.get(domain);
      if (!target) {
        const { kind, reason } = classifyDomain(domain, competitorBrands);
        target = { domain, kind, reason, hits: [], topQueries: [], surfaces: [] };
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

  for (const target of byDomain.values()) {
    target.topQueries = Array.from(new Set(target.hits.map((h) => h.query)));
    target.surfaces = Array.from(new Set(target.hits.map((h) => h.surface)));
  }

  // Sort publishers first (actionable), competitors second, both by hit count
  return Array.from(byDomain.values()).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "publisher" ? -1 : 1;
    return b.hits.length - a.hits.length;
  });
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
