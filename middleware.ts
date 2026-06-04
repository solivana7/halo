import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protect the whole app with HTTP Basic Auth, EXCEPT the cron endpoints,
// which authenticate themselves via the CRON_SECRET bearer token.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};

export function middleware(req: NextRequest) {
  // Cron routes carry their own Bearer CRON_SECRET auth — don't block them.
  if (req.nextUrl.pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  const expectedPass = process.env.BASIC_AUTH_PASS;
  // Fail open if not configured, so a missing env var can't lock everyone out.
  if (!expectedPass) return NextResponse.next();

  const expectedUser = process.env.BASIC_AUTH_USER || "solivana";
  const header = req.headers.get("authorization") || "";

  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(":");
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      if (user === expectedUser && pass === expectedPass) {
        return NextResponse.next();
      }
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="SoliVana", charset="UTF-8"' },
  });
}
