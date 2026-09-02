import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { ROLES, RoleError, listAuthUsers, requireSuperAdmin, type Role } from "@/lib/roles";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const err = (e: unknown) =>
  e instanceof RoleError
    ? NextResponse.json({ error: e.message }, { status: e.status })
    : NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });

const notConfigured = () =>
  NextResponse.json(
    { error: "Team accounts need Supabase. Connect it first (SUPABASE_SETUP.md)." },
    { status: 501 }
  );

export type CmsUser = {
  id: string;
  name: string;
  email: string;
  role: Role | null;
  status: "Active" | "Disabled";
  created_at: string;
  last_sign_in_at: string | null;
};

/** Super Admin only: list all CMS accounts with their roles. */
export async function GET() {
  try {
    await requireSuperAdmin();
    if (!isSupabaseConfigured()) return notConfigured();

    const [users, profilesRes] = await Promise.all([
      listAuthUsers(),
      supabaseAdmin().from("profiles").select("id, name, role, status"),
    ]);
    if (profilesRes.error) throw new Error(profilesRes.error.message);
    const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

    const rows: CmsUser[] = users.map((u) => {
      const p = profiles.get(u.id);
      const banned = !!u.banned_until && new Date(u.banned_until) > new Date();
      return {
        id: u.id,
        name: p?.name || "",
        email: u.email ?? "",
        role: (p?.role as Role) ?? null,
        status: banned || p?.status === "Disabled" ? "Disabled" : "Active",
        created_at: u.created_at ?? "",
        last_sign_in_at: u.last_sign_in_at ?? null,
      };
    });
    return NextResponse.json(rows);
  } catch (e) {
    return err(e);
  }
}

/** Super Admin only: create an account that can sign in immediately. */
export async function POST(req: Request) {
  try {
    const actor = await requireSuperAdmin();
    if (!isSupabaseConfigured()) return notConfigured();

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = ROLES.includes(body.role as Role) ? (body.role as Role) : "Editor";

    if (!email || !email.includes("@")) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password needs at least 8 characters." }, { status: 400 });

    const { data, error } = await supabaseAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: true, // can sign in immediately; no confirmation email needed
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const { error: pErr } = await supabaseAdmin()
      .from("profiles")
      .upsert({ id: data.user.id, name, role, status: "Active" }, { onConflict: "id" });
    if (pErr) throw new Error(pErr.message);

    await logActivity(actor, `Created user ${email} (${role})`, "Users");
    return NextResponse.json({ ok: true, id: data.user.id }, { status: 201 });
  } catch (e) {
    return err(e);
  }
}