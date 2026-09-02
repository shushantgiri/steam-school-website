import { NextResponse } from "next/server";
import { getStaff, updateStaff, STAFF_CATEGORIES, type StaffCategory, type StaffMember } from "@/lib/staff";
import { RoleError, requireArea } from "@/lib/roles";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (e: unknown) =>
  e instanceof RoleError
    ? NextResponse.json({ error: e.message }, { status: e.status })
    : NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });

/** Full staff list, drafts included (staff only). */
export async function GET() {
  try {
    await requireArea("content");
    return NextResponse.json(await getStaff());
  } catch (e) {
    return fail(e);
  }
}

/** POST { action: "create" | "update" | "delete", member } */
export async function POST(req: Request) {
  try {
    const actor = await requireArea("content");
    let b: { action?: string; member?: Partial<StaffMember> };
    try { b = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
    const m = b.member ?? {};

    if (b.action === "delete") {
      if (!m.id) return NextResponse.json({ error: "Which staff member?" }, { status: 400 });
      await updateStaff((all) => all.filter((x) => x.id !== m.id));
      await logActivity(actor, "Removed a staff member", "Content");
      return NextResponse.json({ ok: true });
    }

    const name = (m.name ?? "").toString().trim().slice(0, 80);
    const designation = (m.designation ?? "").toString().trim().slice(0, 80);
    const subjects = (m.subjects ?? "").toString().trim().slice(0, 120);
    const category: StaffCategory = STAFF_CATEGORIES.includes(m.category as StaffCategory) ? (m.category as StaffCategory) : "Teacher";
    const photo = (m.photo ?? "").toString().trim().slice(0, 500);
    const bio = (m.bio ?? "").toString().trim().slice(0, 400);
    const qualification = (m.qualification ?? "").toString().trim().slice(0, 160);
    const featured = typeof m.featured === "boolean" ? m.featured : true;
    const order = Number.isFinite(Number(m.order)) ? Number(m.order) : 0;
    const status = m.status === "Draft" ? "Draft" : "Published";
    if (!name || !designation) return NextResponse.json({ error: "Name and designation are required." }, { status: 400 });

    if (b.action === "update" && m.id) {
      await updateStaff((all) => all.map((x) => (x.id === m.id ? { ...x, name, designation, category, subjects, photo, bio, qualification, featured, order, status } : x)));
      await logActivity(actor, `Updated staff profile of ${name}`, "Content");
    } else {
      const fresh: StaffMember = { id: crypto.randomUUID(), name, designation, category, subjects, photo, bio, qualification, featured, order, status };
      await updateStaff((all) => [...all, fresh]);
      await logActivity(actor, `Added ${name} to teachers & staff`, "Content");
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
