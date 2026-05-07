import { generatePrompts, type BusinessProfile } from "./prompt-templates";
import { QUERIERS, ALL_SURFACES, type Surface } from "./queriers";
import { analyzeResult, type BrandIdentity } from "./analyzer";
import { saveScan, type ScanRecord } from "./storage";

export type RunOptions = {
  surfaces?: Surface[];
  maxPrompts?: number;
  concurrency?: number;
};

async function pMap<T, R>(items: T[], fn: (t: T) => Promise<R>, concurrency: number): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function runScan(
  profile: BusinessProfile & { id: string; domain?: string; aliases?: string[] },
  opts: RunOptions = {}
): Promise<ScanRecord> {
  const surfaces = opts.surfaces ?? Array.from(ALL_SURFACES);
  // Default cap: 8 prompts × 4 surfaces = 32 jobs. At concurrency 8 that
  // fits under Railway's edge proxy ~60s timeout. Override via maxPrompts
  // for the cron path (which has no proxy timeout).
  const prompts = generatePrompts(profile, { max: opts.maxPrompts ?? 8 });
  const brand: BrandIdentity = {
    brand: profile.brand,
    domain: profile.domain,
    aliases: profile.aliases,
  };
  const competitors = profile.competitors ?? [];

  const jobs: Array<{ surface: string; query: string }> = [];
  for (const p of prompts) for (const s of surfaces) jobs.push({ surface: s, query: p.text });

  const results = await pMap(
    jobs,
    async ({ surface, query }) => {
      const fn = QUERIERS[surface];
      if (!fn) {
        return {
          surface,
          query,
          cited: false,
          position: null,
          brandUrlCited: false,
          competitorsMentioned: [],
          answer: "",
          citations: [],
          error: `Unknown surface: ${surface}`,
        };
      }
      const res = await fn(query);
      const a = analyzeResult(res, brand, competitors);
      return {
        surface,
        query,
        cited: a.cited,
        position: a.position,
        brandUrlCited: a.brandUrlCited,
        competitorsMentioned: a.competitorsMentioned,
        excerpt: a.excerpt,
        answer: res.answer,
        citations: res.citations.map((c) => ({ url: c.url, title: c.title })),
        error: res.error,
      };
    },
    opts.concurrency ?? 8
  );

  const record: ScanRecord = {
    id: `${profile.id}-${Date.now()}`,
    ranAt: new Date().toISOString(),
    profileId: profile.id,
    results,
  };
  await saveScan(record);
  return record;
}
