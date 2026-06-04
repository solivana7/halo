import { NextResponse } from "next/server";

// Public, unauthenticated healthcheck endpoint for Railway.
// Exempted from Basic Auth in middleware.ts.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true });
}
