import { NextResponse } from "next/server";
import { RoleError, requireArea } from "@/lib/roles";
import { getAbout, mergeAbout, saveAbout } from "@/lib/about";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getAbout());
}

/** Replace the About page content (Content Managers and Super Admins). */
export async function PUT(req: Request) {
  try {
    const actor = await requireArea("homepage");
    let body: unknown;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
    const next = mergeAbout(body);
    await saveAbout(next);
    await logActivity(actor, "Updated the About page", "Website");
    return NextResponse.json(next);
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: e instanceof Error ? e.message : "Could not save." }, { status: 500 });
  }
}
