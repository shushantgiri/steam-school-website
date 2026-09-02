import { NextResponse } from "next/server";
import { callerEmail, listAuthUsers } from "@/lib/roles";
import { isSupabaseConfigured, supabaseAdmin, supabaseAnon } from "@/lib/supabase";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Change your own password. Requires the CURRENT password (re-verified with
 * Supabase Auth) so a stolen session cookie alone can't lock the owner out.
 * Local single-admin mode has no user table: the password is the
 * ADMIN_PASSWORD_HASH environment variable (see `npm run hash-password`).
 */
export async function POST(req: Request) {
  const email = await callerEmail();
  if (!email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let b: { current?: unknown; next?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
  const current = typeof b.current === "string" ? b.current : "";
  const next = typeof b.next === "string" ? b.next : "";
  if (!current) return NextResponse.json({ error: "Enter your current password." }, { status: 400 });
  if (next.length < 8) return NextResponse.json({ error: "The new password needs at least 8 characters." }, { status: 400 });
  if (next === current) return NextResponse.json({ error: "Choose a password different from the current one." }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "This site runs in single-admin mode. Change the password by running `npm run hash-password -- \"new password\"` and updating ADMIN_PASSWORD_HASH." },
      { status: 400 }
    );
  }

  try {
    const { error: verifyError } = await supabaseAnon().auth.signInWithPassword({ email, password: current });
    if (verifyError) return NextResponse.json({ error: "The current password is incorrect." }, { status: 400 });

    const me = (await listAuthUsers()).find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!me) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    const { error } = await supabaseAdmin().auth.admin.updateUserById(me.id, { password: next });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await logActivity(email, "Changed their own password", "Users");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not change the password." }, { status: 500 });
  }
}
