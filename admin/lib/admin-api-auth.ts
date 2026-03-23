import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE_KEY } from "@/lib/admin-auth";

function readToken(request: Request): string {
  const bearer = request.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim();
  }
  return (request.headers.get("x-admin-token") ?? "").trim();
}

function hasCookieAuth(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const tokens = cookieHeader.split(";").map((item) => item.trim());
  return tokens.includes(`${ADMIN_AUTH_COOKIE_KEY}=1`);
}

export function ensureAdminApiAuth(request: Request): NextResponse | null {
  if (hasCookieAuth(request)) {
    return null;
  }

  const expected = (process.env.ADMIN_API_TOKEN ?? "").trim();
  const actual = readToken(request);
  if (expected.length > 0 && actual === expected) {
    return null;
  }

  if (!actual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
