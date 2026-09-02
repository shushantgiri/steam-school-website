import { NextResponse } from "next/server";
import { getHomepage, mergeHomepage, saveHomepage } from "@/lib/homepage";
import { logActivity } from "@/lib/records";
import { RoleError, requireArea } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getHomepage());
}

/** Content Managers and Super Admins edit the homepage. */
export async function PUT(req: Request) {
  try {
    const actor = await requireArea("homepage");
    let body: unknown;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
    // Merge the edit over the current content (itself already defaults-safe),
    // then persist — partial requests can never blank a section.
    const next = await saveHomepage(mergeHomepage(await getHomepage(), body));
    await logActivity(actor, "Homepage updated", "Homepage");
    return NextResponse.json(next);
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: e instanceof Error ? e.message : "Could not save." }, { status: 500 });
  }
}
