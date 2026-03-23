import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE_KEY } from "@/lib/admin-auth";

export const runtime = "nodejs";

const ADMIN_USERNAME = "mosotea";
const ADMIN_PASSWORD = "mosotea";

type LoginPayload = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  let payload: LoginPayload;
  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username = (payload.username ?? "").trim();
  const password = (payload.password ?? "").trim();
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid account or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_AUTH_COOKIE_KEY,
    value: "1",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
  return response;
}
