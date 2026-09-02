import { NextResponse } from "next/server";
import { supabaseAnon, supabaseAuthConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Password reset. Only meaningful with Supabase Auth — the email comes from
 * Supabase's own mailer (configure the redirect URL in the dashboard under
 * Auth → URL Configuration). Local mode resets via `npm run hash-password`.
 */
export async function POST(req: Request) {
  if (!supabaseAuthConfigured()) {
    return NextResponse.json(
      { error: "Password reset by email needs Supabase Auth. In local mode, run: npm run hash-password -- \"new password\" and update .env.local." },
      { status: 501 }
    );
  }

  let body: { email?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) return NextResponse.json({ error: "Enter your email first." }, { status: 400 });

  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  await supabaseAnon().auth.resetPasswordForEmail(email, site ? { redirectTo: `${site}/admin/login` } : undefined);
  // Always the same answer, so the form can't be used to probe for accounts.
  return NextResponse.json({ ok: true, message: "If that account exists, a reset link is on its way." });
}
