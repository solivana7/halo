import { NextResponse } from "next/server";
import { getProfile } from "@/lib/storage";
import { runScan } from "@/lib/runner";

export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await req.json();
  const profile = await getProfile(body.profileId);
  if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 404 });

  const record = await runScan(profile, {
    surfaces: body.surfaces ?? ["perplexity", "claude", "openai"],
    maxPrompts: body.maxPrompts ?? 15,
  });
  return NextResponse.json(record);
}
