import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getProfile, listScans } from "@/lib/storage";
import { buildOutreachTargets, pitchContext } from "@/lib/outreach";
import { WELLNESS_SERVICES } from "@/lib/wellness-services";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Drafts a pitch email to a publisher whose URLs are getting cited by AI
// for queries the brand wasn't cited on. Voice = founder, direct, no hedging.
const SYSTEM_PROMPT = `You write inclusion-pitch emails on behalf of Natasha Berness, Co-Founder & CEO of SoliVana Wellness Lab in Redwood City, CA. Co-founded with Anna Berness, Co-Founder & CMO. SoliVana is an AI-native nervous system reset lab — never describe it as a spa, day spa, med spa, or gym. "Wellness center" is acceptable when "lab" or "recovery lab" doesn't fit the sentence.

Voice rules (non-negotiable):
- Direct, declarative, zero hedging. No "I hope this finds you well." No "I would love to."
- Forbes Riley cadence: short sentences, one idea per line, named-pain or named-fact opener.
- Never use: embrace, journey, holistic, self-care, "it's not X it's Y", spa day, day spa, "Floating Therapy" (use Float Therapy or REST Float Therapy).
- Acknowledge the publisher's specific work — name the URL or article, never generic flattery.
- Make a single specific ask. One CTA, no menu of options.
- Sign off as "Natasha Berness · Founder & CEO, SoliVana Wellness · solivana.com · (650) 564-4325"

Email structure:
1. Subject line — concrete, specific to their existing article. Numerical or named, never vague.
2. Opener — 1 line. Acknowledge the specific piece of theirs the AI is citing.
3. Why SoliVana belongs — 2-3 short lines. Name the modalities, the credentialing, the moat (16 therapies, 9 private rooms, AI-native, 5.0 Google rating).
4. The ask — one sentence. "Would you consider adding SoliVana to [specific list]?" or "Worth a 15-min visit so you can experience it before you decide?" — pick what fits.
5. Sign-off block.

Length: under 150 words, ideally 100-120. Output ONLY the email — no preamble, no analysis, no markdown.

Format:
SUBJECT: <subject line here>

<email body here>`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profileId, domain } = body;
    if (!profileId || !domain) {
      return NextResponse.json({ error: "Missing profileId or domain" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not set on the server. Add it in Railway → Variables." },
        { status: 503 }
      );
    }

    const profile = await getProfile(profileId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const allScans = await listScans();
    const scans = allScans.filter((s) => s.profileId === profileId);
    const latest = scans[0];
    if (!latest) {
      return NextResponse.json({ error: "No scans yet — run a scan first." }, { status: 400 });
    }

    const targets = buildOutreachTargets(latest, profile.domain);
    const target = targets.find((t) => t.domain === domain);
    if (!target) {
      return NextResponse.json({ error: "Domain not in outreach list." }, { status: 404 });
    }

    const serviceNames = profile.serviceIds
      .map((id) => WELLNESS_SERVICES.find((s) => s.id === id)?.brandExact)
      .filter(Boolean) as string[];

    const context = pitchContext(target, profile.brand, profile.city, profile.region, serviceNames);

    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Draft a pitch email to ${target.domain}.\n\n${context}` }],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    // Split on the first SUBJECT: marker
    let subject = "";
    let bodyText = text;
    const m = text.match(/^\s*SUBJECT:\s*(.+?)\n+([\s\S]+)$/i);
    if (m) {
      subject = m[1].trim();
      bodyText = m[2].trim();
    }

    return NextResponse.json({
      domain: target.domain,
      subject,
      body: bodyText,
      hits: target.hits.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Draft failed. Try again." },
      { status: 500 }
    );
  }
}
