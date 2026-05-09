import { NextResponse } from "next/server";
import { getProfile } from "@/lib/storage";
import { runScan } from "@/lib/runner";
import { ALL_SURFACES } from "@/lib/queriers";

// Fire-and-forget scan endpoint for large prompt counts that exceed
// Railway's ~60s edge proxy timeout. Returns immediately with a 202
// (Accepted). The scan continues running in the background container
// process and writes its result to /data when done. Dashboard polls
// /api/scans to detect completion.

export const maxDuration = 600; // 10 min cap on background work
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const profile = await getProfile(body.profileId);
  if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 404 });

  const surfaces = body.surfaces ?? Array.from(ALL_SURFACES);
  const maxPrompts = body.maxPrompts ?? 30;

  // Fire-and-forget: do not await. Errors logged to Railway only.
  runScan(profile, { surfaces, maxPrompts }).catch((err) => {
    console.error("[scan/background] failed:", err);
  });

  return NextResponse.json(
    {
      status: "started",
      profileId: profile.id,
      surfaces,
      maxPrompts,
      estimatedSeconds: Math.ceil((surfaces.length * maxPrompts * 12) / 8),
      message: "Scan running in background. Refresh in a few minutes to see results.",
    },
    { status: 202 }
  );
}
