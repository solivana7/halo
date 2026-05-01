# Halo

**AI visibility tracker for wellness brands.**

See where ChatGPT, Perplexity, and Claude cite your wellness business — and where your competitors steal the spotlight.

## What it does

Halo runs your business's discovery prompts (auto-generated from your service mix and city) against ChatGPT, Perplexity, and Claude every week and shows you a citation matrix: where you're cited, where you aren't, and which competitors are taking your slot.

Pre-loaded with a wellness service taxonomy (REST Floating Therapy, Fire & Ice Contrast Therapy, Halotherapy, PEMF, Red Light, NeuroVIZR, IV Therapy, Cryotherapy, HBOT, Acupuncture, Functional Medicine, etc.) so a small wellness business only needs to provide:

1. Business name
2. City + region
3. Services they offer (checklist)
4. Conditions / focus / competitors (optional)

Halo generates ~15–20 personalized discovery prompts and runs them.

## Getting started

```bash
npm install
cp .env.example .env.local
# Add at least one of: PERPLEXITY_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY
npm run dev
```

Then visit http://localhost:3030 and walk through onboarding.

## Cost per scan

| Surface     | Per query | 15 prompts |
| ----------- | --------- | ---------- |
| Perplexity  | ~$0.005   | $0.08      |
| Claude      | ~$0.015   | $0.23      |
| ChatGPT     | ~$0.01    | $0.15      |
| **Total**   |           | **~$0.45** |

Weekly = ~$1.80/mo. vs. Otterly $49/mo.

## Architecture

```
app/                    Next.js app router
  onboarding/           Single-page intake form
  dashboard/[id]/       Citation matrix + gaps
  api/profiles/         CRUD profiles
  api/scan/             Triggers a scan
  api/scans/            Lists scan history
lib/
  wellness-services.ts  22 wellness services (id, brand-exact name, variants, outcomes)
  prompt-templates.ts   Templates by intent + generator
  queriers/             perplexity, claude, openai (web search)
  analyzer.ts           Citation detection (mention + position + competitor + url)
  storage.ts            JSON file persistence (data/)
  runner.ts             Orchestrates scan execution
scripts/run-scan.ts     Standalone CLI for cron
data/                   Profiles + scan results (gitignored)
```

## Why pre-loaded prompt library is the IP

Generic LLM-tracking SaaS makes the user write prompts. That's the hard part for a small business. Halo bakes in:

- 22 wellness services with brand-exact names + common variants
- 19 prompt templates across 8 intents (discovery, outcome, comparison, branded, brand-exact, audience, premium, stacked-modality)
- Auto-generation logic that interpolates user's city, region, services, focus, competitors, audiences

Result: a wellness business gets a working scan with ~5 fields filled in.
