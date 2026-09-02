import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST() {
  const res = NextResponse.json({ ok: true });
  // Same attributes as when it was set, with an immediate expiry.
  res.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return res;
}
