import { NextResponse } from "next/server";
import { APP_STATUSES, applications, logActivity, type AppStatus } from "@/lib/records";
import { requireArea, RoleError } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireArea("admissions");
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: "Permission check failed." }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

  const fields: Record<string, unknown> = {};
  if (typeof body.status === "string" && (APP_STATUSES as string[]).includes(body.status)) {
    fields.status = body.status as AppStatus;
  }
  if (typeof body.notes === "string") fields.notes = body.notes;
  if (typeof body.assigned_to === "string") fields.assigned_to = body.assigned_to.trim().slice(0, 80);
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await applications.patch(params.id, fields);
  if (!updated) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  if (fields.status) {
    await logActivity("Admin", `Application ${updated.id} → ${updated.status}`, "Admission");
  }
  if (typeof fields.assigned_to === "string") {
    await logActivity("Admin", `Application ${updated.id} assigned to ${updated.assigned_to || "no one"}`, "Admission");
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireArea("admissions");
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: "Permission check failed." }, { status: 500 });
  }

  const ok = await applications.remove(params.id);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Application not found." }, { status: 404 });
}