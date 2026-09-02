import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { ROLES, RoleError, listAuthUsers, requireSuperAdmin, type Role } from "@/lib/roles";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const err = (e: unknown) =>
  e instanceof RoleError
    ? NextResponse.json({ error: e.message }, { status: e.status })
    : NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });

/** Super Admin only: change a user's name, role, status, or password. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const actor = await requireSuperAdmin();
    if (!isSupabaseConfigured()) return NextResponse.json({ error: "Needs Supabase." }, { status: 501 });

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

    const users = await listAuthUsers();
    const target = users.find((u) => u.id === params.id);
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const profile: Record<string, unknown> = { id: params.id };
    if (typeof body.name === "string") profile.name = body.name.trim().slice(0, 80);
    if (ROLES.includes(body.role as Role)) profile.role = body.role;

    if (body.status === "Disabled" || body.status === "Active") {
      const disable = body.status === "Disabled";
      // Belt and braces: record it in the profile AND ban the auth account,
      // so a disabled person genuinely cannot sign in.
      profile.status = body.status;
      const { error } = await supabaseAdmin().auth.admin.updateUserById(params.id, {
        ban_duration: disable ? "87600h" : "none", // ~10 years vs lifted
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (typeof body.password === "string" && body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: "Password needs at least 8 characters." }, { status: 400 });
      }
      const { error } = await supabaseAdmin().auth.admin.updateUserById(params.id, { password: body.password });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (Object.keys(profile).length > 1) {
      const { error } = await supabaseAdmin().from("profiles").upsert(profile, { onConflict: "id" });
      if (error) throw new Error(error.message);
    }

    await logActivity(actor, `Updated user ${target.email ?? params.id}`, "Users");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return err(e);
  }
}

/** Super Admin only: delete an account (never your own). */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const actor = await requireSuperAdmin();
    if (!isSupabaseConfigured()) return NextResponse.json({ error: "Needs Supabase." }, { status: 501 });

    const users = await listAuthUsers();
    const target = users.find((u) => u.id === params.id);
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (target.email?.toLowerCase() === actor.toLowerCase()) {
      return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
    }

    const { error } = await supabaseAdmin().auth.admin.deleteUser(params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await supabaseAdmin().from("profiles").delete().eq("id", params.id);

    await logActivity(actor, `Deleted user ${target.email ?? params.id}`, "Users");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return err(e);
  }
}