import { NextResponse } from "next/server";
import { MSG_STATUSES, messages, type MsgStatus } from "@/lib/records";
import { requireArea, RoleError } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireArea("messages");
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: "Permission check failed." }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
  if (typeof body.status !== "string" || !(MSG_STATUSES as string[]).includes(body.status)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }
  const updated = await messages.patch(params.id, { status: body.status as MsgStatus });
  return updated
    ? NextResponse.json(updated)
    : NextResponse.json({ error: "Message not found." }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireArea("messages");
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: "Permission check failed." }, { status: 500 });
  }

  const ok = await messages.remove(params.id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Message not found." }, { status: 404 });
}
