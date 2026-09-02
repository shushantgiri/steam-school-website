import { NextResponse } from "next/server";
import { RoleError, requireArea } from "@/lib/roles";
import { createResult, getBatch, normalizeName, RESULT_STATUSES, type ResultStatus } from "@/lib/results";
import { parseAttendance } from "@/lib/results-csv";
import { computeFromMarks } from "@/lib/grading";
import { bsToAd, isValidBs } from "@/lib/bs-calendar";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Add a single result to a batch. */
export async function POST(req: Request) {
  try {
    const actor = await requireArea("results");
    let b: Record<string, unknown>;
    try { b = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

    const batchId = typeof b.batch_id === "string" ? b.batch_id : "";
    const name = typeof b.student_name === "string" ? b.student_name.trim().slice(0, 80) : "";
    const dob = typeof b.date_of_birth_bs === "string" ? b.date_of_birth_bs.trim() : "";
    const gpa = Number(b.gpa);
    const status = RESULT_STATUSES.includes(b.result_status as ResultStatus) ? (b.result_status as ResultStatus) : "Passed";

    const batch = batchId ? await getBatch(batchId) : null;
    if (!batch) return NextResponse.json({ error: "Choose a result batch first." }, { status: 400 });
    if (!name) return NextResponse.json({ error: "Student name is required." }, { status: 400 });
    if (!isValidBs(dob)) return NextResponse.json({ error: "Date of birth must be a valid BS date (YYYY-MM-DD)." }, { status: 400 });
    const attendance = parseAttendance(typeof b.attendance === "string" ? b.attendance : "");
    if (attendance === "invalid") return NextResponse.json({ error: "Attendance must be days present / working days, e.g. 180/200." }, { status: 400 });

    // With a marks scheme the GPA and status are derived from the marks.
    const marks: Record<string, number | null> = {};
    let storedGpa = 0;
    let storedStatus: ResultStatus = status;
    if (batch.subjects.length > 0) {
      const raw = (b.marks && typeof b.marks === "object" ? b.marks : {}) as Record<string, unknown>;
      for (const sub of batch.subjects) {
        const v = raw[sub.name];
        if (v === null || v === undefined || v === "") { marks[sub.name] = null; continue; }
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0 || n > sub.full_marks) {
          return NextResponse.json({ error: `Marks for ${sub.name} must be between 0 and ${sub.full_marks}.` }, { status: 400 });
        }
        marks[sub.name] = Math.round(n * 100) / 100;
      }
      const c = computeFromMarks(batch.subjects, marks);
      storedGpa = c.gpa;
      storedStatus = status === "Withheld" ? "Withheld" : c.status;
    } else {
      if (Number.isNaN(gpa) || gpa < 0 || gpa > 4) return NextResponse.json({ error: "GPA must be between 0 and 4." }, { status: 400 });
      storedGpa = Math.round(gpa * 100) / 100;
    }

    const created = await createResult(batchId, {
      student_name: name,
      student_name_normalized: normalizeName(name),
      date_of_birth_bs: dob,
      date_of_birth_ad: bsToAd(dob) ?? "",
      roll_number: typeof b.roll_number === "string" ? b.roll_number.trim().slice(0, 20) : "",
      section: typeof b.section === "string" ? b.section.trim().slice(0, 10) : "",
      attendance_present: attendance[0],
      attendance_total: attendance[1],
      marks,
      gpa: storedGpa,
      result_status: storedStatus,
      remarks: typeof b.remarks === "string" ? b.remarks.trim().slice(0, 300) : "",
    }, actor);
    if (!created.ok) {
      return NextResponse.json(
        { error: "A result for this student (same name and date of birth) already exists in this batch." },
        { status: 409 }
      );
    }
    await logActivity(actor, `Added result for ${name} to ${batch.title} (${batch.class})`, "Results");
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });
  }
}
