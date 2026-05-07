import { NextResponse } from "next/server";
import { saveProfile, listProfiles, type ProfileRecord } from "@/lib/storage";

export async function POST(req: Request) {
  const body = await req.json();
  const id = `${slug(body.brand)}-${Date.now().toString(36)}`;
  const record: ProfileRecord = {
    id,
    brand: body.brand,
    aliases: body.aliases ?? [],
    domain: body.domain,
    city: body.city,
    region: body.region,
    adjacentCities: body.adjacentCities ?? [],
    serviceIds: body.serviceIds ?? [],
    customServices: body.customServices ?? [],
    focusOutcomes: body.focusOutcomes ?? [],
    competitors: body.competitors ?? [],
    audiences: body.audiences ?? [],
    createdAt: new Date().toISOString(),
  };
  await saveProfile(record);
  return NextResponse.json({ id });
}

export async function GET() {
  return NextResponse.json(await listProfiles());
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "brand";
}
