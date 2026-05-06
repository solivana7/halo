import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Returns which API providers are configured. Never returns the keys themselves.
export async function GET() {
  return NextResponse.json({
    perplexity: Boolean(process.env.PERPLEXITY_API_KEY),
    claude: Boolean(process.env.ANTHROPIC_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    gemini: Boolean(process.env.GOOGLE_AI_API_KEY),
    resend: Boolean(process.env.RESEND_API_KEY),
    cron: Boolean(process.env.CRON_SECRET),
    dataDir: process.env.HALO_DATA_DIR ?? "./data (default)",
  });
}
