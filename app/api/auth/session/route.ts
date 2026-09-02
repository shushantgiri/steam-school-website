import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, authSecret, verifySessionToken } from "@/lib/auth-token";
import { areasFor, callerRole } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Who is signed in and what their role may see — powers the admin shell. */
export async function GET() {
  const session = await verifySessionToken(authSecret(), cookies().get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ authenticated: false, email: null, role: null, areas: [] });
  try {
    const caller = await callerRole();
    return NextResponse.json({
      authenticated: true,
      email: session.sub,
      role: caller?.role ?? null,
      areas: areasFor(caller?.role ?? null),
    });
  } catch {
    // Role lookup hiccup (e.g. network) — stay signed in, show minimal nav.
    return NextResponse.json({ authenticated: true, email: session.sub, role: null, areas: [] });
  }
}
