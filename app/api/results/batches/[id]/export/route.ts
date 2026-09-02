import { NextResponse } from "next/server";
import { RoleError, requireArea } from "@/lib/roles";
import { allBatchResults, getBatch } from "@/lib/results";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (v: string | number) => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Download one batch as CSV (staff only). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireArea("results");
    const batch = await getBatch(params.id);
    if (!batch) return NextResponse.json({ error: "Result batch not found." }, { status: 404 });
    const rows = await allBatchResults(params.id);
    // Same shape as the import template, so an export can be re-imported.
    const att = (r: (typeof rows)[number]) =>
      r.attendance_present !== null && r.attendance_total !== null ? `${r.attendance_present}/${r.attendance_total}` : "";
    const subjectCols = batch.subjects.map((s) => s.name);
    const head = ["student_name", "date_of_birth", "roll_number", "section", "attendance", ...subjectCols, "gpa", "result_status", "remarks"];
    const lines = [
      head.map(esc).join(","),
      ...rows.map((r) =>
        [
          r.student_name, r.date_of_birth_bs, r.roll_number, r.section, att(r),
          ...subjectCols.map((c) => (r.marks[c] === null || r.marks[c] === undefined ? "" : String(r.marks[c]))),
          r.gpa.toFixed(2), r.result_status, r.remarks,
        ].map(esc).join(",")
      ),
    ];
    await logActivity(actor, `Exported ${rows.length} results from ${batch.title} (${batch.class})`, "Results");
    const filename = `${batch.title} - ${batch.class}`.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-");
    return new NextResponse(lines.join("\r\n") + "\r\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename || "results"}.csv"`,
      },
    });
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: e instanceof Error ? e.message : "Export failed." }, { status: 500 });
  }
}
