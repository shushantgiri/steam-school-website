import { NextResponse } from "next/server";
import { RoleError, requireArea } from "@/lib/roles";
import { getNavigation, saveNavigation } from "@/lib/navigation";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The public website's menu structure, editable in Admin → Navigation. */
export async function GET() {
  return NextResponse.json(await getNavigation());
}

export async function PUT(req: Request) {
  try {
    const actor = await requireArea("navigation");
    let body: unknown;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
    const saved = await saveNavigation(body);
    await logActivity(actor, "Updated website navigation", "Homepage");
    return NextResponse.json(saved);
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: e instanceof Error ? e.message : "Could not save." }, { status: 500 });
  }
}
