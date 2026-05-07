import { NextResponse } from "next/server";
import { getProfile } from "@/lib/storage";
import { runScan } from "@/lib/runner";
import { ALL_SURFACES } from "@/lib/queriers";

export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await req.json();
  const profile = await getProfile(body.profileId);
  if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 404 });

  const record = await runScan(profile, {
    surfaces: body.surfaces ?? Array.from(ALL_SURFACES),
    maxPrompts: body.maxPrompts ?? 15,
  });
  return NextResponse.json(record);
}
