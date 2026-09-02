import { NextResponse } from "next/server";
import { logActivity, messages } from "@/lib/records";
import { requireArea, RoleError } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireArea("messages");
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: "Permission check failed." }, { status: 500 });
  }

  return NextResponse.json(await messages.list());
}

/** Public: contact form submission. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

  const s = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  if (!s("name") || !s("body")) {
    return NextResponse.json({ error: "Please add your name and a message." }, { status: 400 });
  }
  if (!s("email") && !s("phone")) {
    return NextResponse.json({ error: "Add an email or phone number so the school can reply." }, { status: 400 });
  }

  const saved = await messages.insert({
    name: s("name"), email: s("email"), phone: s("phone"),
    subject: s("subject") || "Website enquiry", body: s("body").slice(0, 4000),
  });
  await logActivity("Website", `New message — ${saved.subject}`, "Message");
  return NextResponse.json({ ok: true }, { status: 201 });
}
