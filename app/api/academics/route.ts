import { NextResponse } from "next/server";
import { RoleError, requireArea } from "@/lib/roles";
import { getAcademics, saveAcademics } from "@/lib/academics";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Classes, examinations and academic years — read by public forms too. */
export async function GET() {
  return NextResponse.json(await getAcademics());
}

export async function PUT(req: Request) {
  try {
    const actor = await requireArea("academics");
    let body: unknown;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
    const saved = await saveAcademics(body);
    await logActivity(actor, "Updated academic setup (classes, examinations, years)", "Settings");
    return NextResponse.json(saved);
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: e instanceof Error ? e.message : "Could not save." }, { status: 500 });
  }
}
