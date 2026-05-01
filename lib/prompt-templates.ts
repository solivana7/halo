// Prompt template library — the core IP of Halo.
// Templates are typed by intent. The generator interpolates {service}, {city},
// {region}, {focus}, {brand}, {competitor}, {condition} per business.
//
// Insights baked in (from W17/W18 SoliVana audits):
//   - Brand-exact service names (e.g. "REST Floating Therapy") matter for
//     entity recognition. Generate at least one query per brandExact service.
//   - Geographic anchoring matters: city, region, AND adjacent cities all need
//     coverage. Perplexity skews to where reviews are densest, so multiple
//     geo-variants are needed.
//   - Outcome-based queries ("recover from burnout", "Hashimoto's") are how
//     LLMs reframe discovery — don't only optimize for service names.
//   - Comparison/alternative queries ("alternative to Remedy Place") are
//     under-served and high-leverage.

export type PromptIntent =
  | "discovery_geo"     // "best [service] [city]"
  | "outcome_geo"       // "where to recover from [condition] [region]"
  | "discovery_premium" // "private/luxury [service] [region]"
  | "comparison"        // "alternative to [competitor] [region]"
  | "branded"           // "[brand] [city]"
  | "brand_exact"       // "[brandExactService] near me [region]"
  | "stacked_modality"  // "[serviceA] and [serviceB] near [city]"
  | "audience";         // "[service] for [audience]"

export type PromptTemplate = {
  id: string;
  intent: PromptIntent;
  template: string;
  requiresField: ("service" | "city" | "region" | "focus" | "brand" | "competitor" | "condition" | "audience")[];
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Discovery × geography (the bread and butter)
  { id: "best_service_city", intent: "discovery_geo", template: "best {service} in {city}", requiresField: ["service", "city"] },
  { id: "best_service_region", intent: "discovery_geo", template: "best {service} {region}", requiresField: ["service", "region"] },
  { id: "top_service_near_me", intent: "discovery_geo", template: "top {service} near {city}", requiresField: ["service", "city"] },
  { id: "where_service_region", intent: "discovery_geo", template: "where to find {service} in {region}", requiresField: ["service", "region"] },

  // Premium / private framing — captures executive + luxury intent
  { id: "private_service_region", intent: "discovery_premium", template: "private {service} {region}", requiresField: ["service", "region"] },
  { id: "luxury_wellness_region", intent: "discovery_premium", template: "luxury wellness spa {region}", requiresField: ["region"] },
  { id: "exec_wellness_region", intent: "discovery_premium", template: "where executives recover from burnout in {region}", requiresField: ["region"] },

  // Outcome-based — how LLMs reframe queries
  { id: "recover_condition_region", intent: "outcome_geo", template: "where to recover from {condition} in {region}", requiresField: ["condition", "region"] },
  { id: "wellness_for_condition", intent: "outcome_geo", template: "wellness spa for {condition} {region}", requiresField: ["condition", "region"] },
  { id: "service_for_condition", intent: "outcome_geo", template: "{service} for {condition}", requiresField: ["service", "condition"] },

  // Comparison — high leverage, under-served
  { id: "alternative_competitor", intent: "comparison", template: "alternative to {competitor} in {region}", requiresField: ["competitor", "region"] },
  { id: "competitor_vs_brand", intent: "comparison", template: "{competitor} vs {brand}", requiresField: ["competitor", "brand"] },
  { id: "competitor_alternative", intent: "comparison", template: "places like {competitor} {region}", requiresField: ["competitor", "region"] },

  // Branded (defensive — makes sure you own your name)
  { id: "branded_city", intent: "branded", template: "{brand} {city}", requiresField: ["brand", "city"] },
  { id: "branded_reviews", intent: "branded", template: "{brand} reviews", requiresField: ["brand"] },

  // Brand-exact — drives entity authority for your service names
  { id: "brand_exact_near_me", intent: "brand_exact", template: "{service} near me {region}", requiresField: ["service", "region"] },
  { id: "brand_exact_city", intent: "brand_exact", template: "{service} {city}", requiresField: ["service", "city"] },

  // Stacked modality — for spas offering combos
  { id: "service_plus_city", intent: "stacked_modality", template: "{service} {city}", requiresField: ["service", "city"] },

  // Audience-targeted
  { id: "service_for_audience", intent: "audience", template: "{service} for {audience}", requiresField: ["service", "audience"] },
];

// ----- Generator -----

export type BusinessProfile = {
  brand: string;
  city: string;
  region: string;             // e.g. "Bay Area", "Silicon Valley", "Peninsula"
  adjacentCities?: string[];  // e.g. ["Atherton", "Menlo Park", "Palo Alto"]
  serviceIds: string[];       // ids from WELLNESS_SERVICES
  focusOutcomes?: string[];   // user-supplied conditions / focus areas
  competitors?: string[];     // brand names to track comparisons against
  audiences?: string[];       // e.g. ["executives", "athletes", "couples"]
};

import { WELLNESS_SERVICES } from "./wellness-services";

export type GeneratedPrompt = {
  text: string;
  intent: PromptIntent;
  templateId: string;
  meta: Record<string, string>;
};

export function generatePrompts(profile: BusinessProfile, opts?: { max?: number }): GeneratedPrompt[] {
  const services = WELLNESS_SERVICES.filter((s) => profile.serviceIds.includes(s.id));
  const max = opts?.max ?? 30;
  const out: GeneratedPrompt[] = [];

  const fill = (tpl: PromptTemplate, vars: Record<string, string>) => {
    let text = tpl.template;
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, v);
    out.push({ text, intent: tpl.intent, templateId: tpl.id, meta: vars });
  };

  // 1. Branded queries — always include
  for (const t of PROMPT_TEMPLATES.filter((p) => p.intent === "branded")) {
    fill(t, { brand: profile.brand, city: profile.city });
  }

  // 2. One brand-exact query per top service (variants drive discovery)
  for (const svc of services.slice(0, 5)) {
    fill(
      PROMPT_TEMPLATES.find((p) => p.id === "brand_exact_near_me")!,
      { service: svc.brandExact, region: profile.region }
    );
    // Also query the top variant — captures generic search intent
    if (svc.variants[0]) {
      fill(
        PROMPT_TEMPLATES.find((p) => p.id === "best_service_city")!,
        { service: svc.variants[0], city: profile.city }
      );
    }
  }

  // 3. Premium/discovery for the region
  fill(PROMPT_TEMPLATES.find((p) => p.id === "luxury_wellness_region")!, { region: profile.region });
  fill(PROMPT_TEMPLATES.find((p) => p.id === "exec_wellness_region")!, { region: profile.region });

  // 4. Outcome-based — use service.outcomes + user focus
  const conditions = new Set<string>();
  for (const svc of services) for (const o of svc.outcomes) conditions.add(o);
  for (const f of profile.focusOutcomes ?? []) conditions.add(f);
  for (const cond of [...conditions].slice(0, 3)) {
    fill(
      PROMPT_TEMPLATES.find((p) => p.id === "wellness_for_condition")!,
      { condition: cond, region: profile.region }
    );
  }

  // 5. Comparison queries against named competitors
  for (const c of (profile.competitors ?? []).slice(0, 3)) {
    fill(
      PROMPT_TEMPLATES.find((p) => p.id === "alternative_competitor")!,
      { competitor: c, region: profile.region }
    );
  }

  // 6. Adjacent cities — capture geographic spillover
  for (const city of (profile.adjacentCities ?? []).slice(0, 2)) {
    if (services[0]) {
      fill(
        PROMPT_TEMPLATES.find((p) => p.id === "best_service_city")!,
        { service: services[0].variants[0] ?? services[0].brandExact, city }
      );
    }
  }

  // Dedupe by text and cap
  const seen = new Set<string>();
  return out.filter((p) => (seen.has(p.text) ? false : (seen.add(p.text), true))).slice(0, max);
}
