import { NextResponse } from "next/server";
import { RoleError, requireArea } from "@/lib/roles";
import { RESULT_STATUSES, deleteResult, patchResultWithScheme, type ExamResult, type ResultStatus } from "@/lib/results";
import { parseAttendance } from "@/lib/results-csv";
import { bsToAd, isValidBs } from "@/lib/bs-calendar";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const fail = (e: unknown) =>
  e instanceof RoleError
    ? NextResponse.json({ error: e.message }, { status: e.status })
    : NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });

/** Edit one student's result. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const actor = await requireArea("results");
    let b: Record<string, unknown>;
    try { b = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

    const fields: Partial<ExamResult> = {};
    if (typeof b.student_name === "string" && b.student_name.trim()) fields.student_name = b.student_name.trim().slice(0, 80);
    if (typeof b.date_of_birth_bs === "string") {
      const dob = b.date_of_birth_bs.trim();
      if (!isValidBs(dob)) return NextResponse.json({ error: "Date of birth must be a valid BS date (YYYY-MM-DD)." }, { status: 400 });
      fields.date_of_birth_bs = dob;
      fields.date_of_birth_ad = bsToAd(dob) ?? "";
    }
    if (typeof b.remarks === "string") fields.remarks = b.remarks.trim().slice(0, 300);
    if (typeof b.roll_number === "string") fields.roll_number = b.roll_number.trim().slice(0, 20);
    if (typeof b.section === "string") fields.section = b.section.trim().slice(0, 10);
    if (typeof b.attendance === "string") {
      const att = parseAttendance(b.attendance);
      if (att === "invalid") return NextResponse.json({ error: "Attendance must be days present / working days, e.g. 180/200." }, { status: 400 });
      fields.attendance_present = att[0];
      fields.attendance_total = att[1];
    }
    if (b.marks && typeof b.marks === "object") {
      const marks: Record<string, number | null> = {};
      for (const [k, v] of Object.entries(b.marks as Record<string, unknown>)) {
        if (v === null || v === "") { marks[k] = null; continue; }
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: `Invalid marks for ${k}.` }, { status: 400 });
        marks[k] = Math.round(n * 100) / 100;
      }
      fields.marks = marks;
    }
    if (b.gpa !== undefined) {
      const gpa = Number(b.gpa);
      if (Number.isNaN(gpa) || gpa < 0 || gpa > 4) return NextResponse.json({ error: "GPA must be between 0 and 4." }, { status: 400 });
      fields.gpa = Math.round(gpa * 100) / 100;
    }
    if (b.result_status !== undefined) {
      if (!RESULT_STATUSES.includes(b.result_status as ResultStatus)) {
        return NextResponse.json({ error: "Invalid result status." }, { status: 400 });
      }
      fields.result_status = b.result_status as ResultStatus;
    }
    if (Object.keys(fields).length === 0) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });

    const updated = await patchResultWithScheme(params.id, fields, actor);
    if (!updated) return NextResponse.json({ error: "Result not found." }, { status: 404 });
    await logActivity(actor, `Edited result of ${updated.student_name}`, "Results");
    return NextResponse.json(updated);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const actor = await requireArea("results");
    const ok = await deleteResult(params.id);
    if (!ok) return NextResponse.json({ error: "Result not found." }, { status: 404 });
    await logActivity(actor, "Deleted an examination result", "Results");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
