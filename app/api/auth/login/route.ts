import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth-password";
import { SESSION_COOKIE, authSecret, createSessionToken, sessionCookieOptions } from "@/lib/auth-token";
import { supabaseAnon, supabaseAuthConfigured } from "@/lib/supabase";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EIGHT_HOURS = 60 * 60 * 8;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** Slows down guessing, and hides whether it was the email or the password. */
const pause = () => new Promise((r) => setTimeout(r, 400));

/**
 * Two credential backends behind one session:
 *   • Supabase Auth (production) — when NEXT_PUBLIC_SUPABASE_ANON_KEY is set,
 *     credentials are verified by supabase.auth.signInWithPassword, so admin
 *     accounts are managed in Supabase (invites, password reset, disabling).
 *   • Local mode — ADMIN_EMAIL + ADMIN_PASSWORD_HASH from .env.local.
 * Either way the browser session is our signed httpOnly cookie, which the
 * Edge middleware can verify without a network call.
 */
export async function POST(req: Request) {
  const secret = authSecret();
  const useSupabase = supabaseAuthConfigured();

  if (!secret || (!useSupabase && !process.env.ADMIN_PASSWORD_HASH)) {
    return NextResponse.json(
      { error: "Admin sign-in is not configured yet. Set AUTH_SECRET plus either Supabase keys or ADMIN_PASSWORD_HASH (npm run hash-password)." },
      { status: 503 }
    );
  }

  let body: { email?: unknown; password?: unknown; remember?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON object." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Enter both your email and password." }, { status: 400 });
  }

  let valid = false;
  if (useSupabase) {
    const { data, error } = await supabaseAnon().auth.signInWithPassword({ email, password });
    valid = !error && !!data.user;
  } else {
    const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    valid =
      (!expectedEmail || email.toLowerCase() === expectedEmail) &&
      verifyPassword(password, process.env.ADMIN_PASSWORD_HASH!);
  }

  if (!valid) {
    await pause();
    return NextResponse.json({ error: "Email or password doesn’t match." }, { status: 401 });
  }

  const maxAge = body.remember === true ? THIRTY_DAYS : EIGHT_HOURS;
  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(secret, email, maxAge), sessionCookieOptions(maxAge));
  await logActivity(email, "Signed in", "Auth");
  return res;
}
