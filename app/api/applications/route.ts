import { NextResponse } from "next/server";
import { applications, logActivity } from "@/lib/records";
import { requireArea, RoleError } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: list all applications (middleware leaves GET open, but this data is
 *  private — so this GET checks nothing extra only because middleware now
 *  protects it explicitly; see middleware.ts PRIVATE_READS). */
export async function GET() {
  try {
    await requireArea("admissions");
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: "Permission check failed." }, { status: 500 });
  }

  return NextResponse.json(await applications.list());
}

/** Public: submit an application from the website form. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

  const s = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const required: Array<[string, string]> = [
    ["student", "student's name"], ["grade", "grade"], ["parent", "parent's name"], ["phone", "phone number"],
  ];
  for (const [key, label] of required) {
    if (!s(key)) return NextResponse.json({ error: `Please add the ${label}.` }, { status: 400 });
  }

  const saved = await applications.insert({
    student: s("student"), grade: s("grade"), dob: s("dob"), previous_school: s("previous_school"),
    parent: s("parent"), phone: s("phone"), email: s("email"), address: s("address"),
    documents: Array.isArray(body.documents)
      ? (body.documents as unknown[]).filter((d): d is string => typeof d === "string").slice(0, 6)
      : [],
  });
  await logActivity("Website", `New admission — ${saved.student} (${saved.grade})`, "Admission");
  return NextResponse.json({ id: saved.id }, { status: 201 });
}