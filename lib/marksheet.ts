import type { SiteSettings } from "./types";
import type { MarksheetRecord } from "./results";
import { attendanceOf, GRADE_SCALE } from "./grading";
import { bsDisplay, bsToAd, formatBs, todayBs } from "./bs-calendar";

/**
 * Everything the marksheet shows, pre-formatted. The HTML sheet and the PDF
 * both render from this so they never disagree. Deliberately lean: no
 * percentage, rank, QR or per-subject remarks — the marks table and the
 * result summary are the document.
 */
export type MarksheetView = {
  serial: string;
  school: {
    name: string;
    headerNote: string;    // affiliation / motto line under the name
    address: string;
    contact: string;       // "Tel … · Email …"
    established: string;
    registrationNo: string;
    logoUrl: string;       // "" → hide
  };
  exam: { title: string; examination: string; academicYear: string; klass: string; section: string };
  student: { name: string; dobBs: string; dobAd: string; rollNumber: string };
  attendance: string | null; // "182 of 200 days (91%)"
  rows: Array<{ sn: number; subject: string; fullMarks: number; passMarks: number; obtained: string; grade: string; point: string; failed: boolean }>;
  summary: { totalMarks: number; obtained: string; grade: string; gradeLabel: string; gpa: string; status: "PASS" | "FAIL" | "WITHHELD" };
  remarks: string;       // "" when the school entered none
  issued: { bs: string; ad: string };
  gradeScale: Array<{ grade: string; range: string; point: string }>;
  signatures: {
    mode: "both" | "principal" | "none";
    principal: { name: string; image: string };
    classTeacher: { name: string; image: string };
  };
  footerNote: string;
};

const fmt2 = (n: number) => n.toFixed(2);
const num = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1));

/** AD "2026-08-31" → "31 August 2026". */
export const adDisplay = (iso: string) => {
  const d = new Date(iso + "T00:00:00Z");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

export function buildMarksheet(rec: MarksheetRecord, settings: SiteSettings): MarksheetView {
  const { batch, result, computed } = rec;
  const ms = settings.marksheet;
  const issueBs = batch.issue_date_bs || formatBs(todayBs());
  const issueAd = bsToAd(issueBs) ?? "";
  const status = result.result_status === "Withheld" ? "WITHHELD" : computed.status === "Passed" ? "PASS" : "FAIL";
  const att = attendanceOf(result.attendance_present, result.attendance_total);

  const rangeText = (i: number) => {
    const g = GRADE_SCALE[i];
    if (i === GRADE_SCALE.length - 1) return `Below ${GRADE_SCALE[i - 1].min}`;
    const upper = i === 0 ? 100 : GRADE_SCALE[i - 1].min - 1;
    return `${g.min}–${upper}`;
  };

  return {
    serial: `${batch.academic_year}-${result.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    school: {
      name: settings.name,
      headerNote: ms.headerNote || settings.motto || "",
      address: settings.address,
      contact: [settings.phone && `Tel ${settings.phone}`, settings.email].filter(Boolean).join("   ·   "),
      established: settings.establishedYear || "",
      registrationNo: settings.registrationNo || "",
      logoUrl: ms.showLogo ? settings.logoUrl || "/school-logo.png" : "",
    },
    exam: { title: batch.title, examination: batch.examination_name, academicYear: batch.academic_year, klass: batch.class, section: result.section || "—" },
    student: {
      name: result.student_name,
      dobBs: bsDisplay(result.date_of_birth_bs),
      dobAd: result.date_of_birth_ad ? adDisplay(result.date_of_birth_ad) : "",
      rollNumber: result.roll_number || "—",
    },
    attendance: att ? `${att.present} of ${att.total} days (${Math.round(att.percent)}%)` : null,
    rows: computed.rows.map((r, i) => ({
      sn: i + 1, subject: r.name, fullMarks: r.full_marks, passMarks: r.pass_marks,
      obtained: r.obtained === null ? "AB" : num(r.obtained), grade: r.grade, point: fmt2(r.point), failed: !r.passed,
    })),
    summary: {
      totalMarks: computed.total_full,
      obtained: num(computed.total_obtained),
      grade: computed.overall_grade,
      gradeLabel: computed.overall_label,
      gpa: fmt2(computed.gpa),
      status,
    },
    remarks: result.remarks || "",
    issued: { bs: bsDisplay(issueBs), ad: issueAd ? adDisplay(issueAd) : "" },
    gradeScale: GRADE_SCALE.map((g, i) => ({ grade: g.grade, range: rangeText(i), point: fmt2(g.point) })),
    signatures: {
      mode: ms.signatures,
      principal: { name: settings.principalName || "", image: ms.principalSignature || "" },
      classTeacher: { name: ms.classTeacherName || "", image: ms.classTeacherSignature || "" },
    },
    footerNote: ms.footerNote || "",
  };
}
