import { NextResponse } from "next/server";
import { listScans } from "@/lib/storage";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const profileId = url.searchParams.get("profileId");
  const all = await listScans();
  return NextResponse.json(profileId ? all.filter((s) => s.profileId === profileId) : all);
}
