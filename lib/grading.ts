/**
 * Grading engine for marksheets — pure functions, safe on client and server.
 *
 * Scale: the letter-grading system used by Nepal's National Examinations
 * Board (2078 revision). A subject is graded on its percentage; the overall
 * GPA is the credit-weighted mean of subject grade points, weighted by each
 * subject's full marks. A student passes when every subject reaches its pass
 * marks; "Withheld" is an administrative status set manually.
 */
import type { ExamResult, ResultBatch, ResultStatus, SubjectDef } from "./results-shared";

export type GradeBand = { min: number; grade: string; point: number; label: string };

export const GRADE_SCALE: GradeBand[] = [
  { min: 90, grade: "A+", point: 4.0, label: "Outstanding" },
  { min: 80, grade: "A",  point: 3.6, label: "Excellent" },
  { min: 70, grade: "B+", point: 3.2, label: "Very Good" },
  { min: 60, grade: "B",  point: 2.8, label: "Good" },
  { min: 50, grade: "C+", point: 2.4, label: "Satisfactory" },
  { min: 40, grade: "C",  point: 2.0, label: "Acceptable" },
  { min: 35, grade: "D",  point: 1.6, label: "Basic" },
  { min: 0,  grade: "NG", point: 0.0, label: "Not Graded" },
];

export const gradeFor = (percent: number): GradeBand =>
  GRADE_SCALE.find((g) => percent >= g.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];

/** Overall letter grade for a GPA (inverse of the scale's grade points). */
export function gradeForGpa(gpa: number): GradeBand {
  // Pick the highest band whose point is ≤ gpa (+ tiny tolerance for rounding).
  return GRADE_SCALE.find((g) => gpa + 1e-9 >= g.point) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
}

export type SubjectRow = {
  name: string;
  full_marks: number;
  pass_marks: number;
  obtained: number | null;  // null → absent / not marked
  percent: number;
  grade: string;
  point: number;
  passed: boolean;
};

export type Computed = {
  rows: SubjectRow[];
  total_full: number;
  total_obtained: number;
  percentage: number;       // 0–100, two decimals
  gpa: number;              // two decimals
  overall_grade: string;
  overall_label: string;
  status: ResultStatus;     // Passed / Failed (Withheld is never inferred)
  absent_count: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Grade every subject and roll them up. Missing marks count as absent (0). */
export function computeFromMarks(subjects: SubjectDef[], marks: Record<string, number | null>): Computed {
  const rows: SubjectRow[] = subjects.map((s) => {
    const raw = marks[s.name];
    const obtained = typeof raw === "number" && Number.isFinite(raw) ? Math.min(Math.max(raw, 0), s.full_marks) : null;
    const scored = obtained ?? 0;
    const percent = s.full_marks > 0 ? (scored / s.full_marks) * 100 : 0;
    const band = gradeFor(percent);
    return {
      name: s.name,
      full_marks: s.full_marks,
      pass_marks: s.pass_marks,
      obtained,
      percent: round2(percent),
      grade: band.grade,
      point: band.point,
      passed: obtained !== null && scored >= s.pass_marks,
    };
  });
  const total_full = rows.reduce((a, r) => a + r.full_marks, 0);
  const total_obtained = rows.reduce((a, r) => a + (r.obtained ?? 0), 0);
  const percentage = total_full > 0 ? round2((total_obtained / total_full) * 100) : 0;
  const weighted = rows.reduce((a, r) => a + r.point * r.full_marks, 0);
  const allPassed = rows.length > 0 && rows.every((r) => r.passed);
  // A failed subject caps the GPA at the failing band, as on official sheets.
  const gpa = total_full > 0 ? round2(allPassed ? weighted / total_full : Math.min(weighted / total_full, 1.6)) : 0;
  const overall = gradeForGpa(gpa);
  return {
    rows,
    total_full,
    total_obtained: round2(total_obtained),
    percentage,
    gpa,
    overall_grade: allPassed ? overall.grade : rows.some((r) => r.obtained === null) ? "NG" : overall.grade,
    overall_label: allPassed ? overall.label : "Not Graded",
    status: allPassed ? "Passed" : "Failed",
    absent_count: rows.filter((r) => r.obtained === null).length,
  };
}

/** Whether a batch carries subject-wise marks (and therefore marksheets). */
export const hasMarksheet = (batch: Pick<ResultBatch, "subjects">) => batch.subjects.length > 0;

/**
 * Apply the batch's scheme to a result's marks, returning the fields that
 * must be stored alongside (gpa + status) so search and lists stay correct.
 * Withheld set by an admin is preserved.
 */
export function deriveStoredFields(
  batch: Pick<ResultBatch, "subjects">,
  result: Pick<ExamResult, "marks" | "result_status">
): Pick<ExamResult, "gpa" | "result_status"> {
  if (!hasMarksheet(batch)) return { gpa: 0, result_status: result.result_status };
  const c = computeFromMarks(batch.subjects, result.marks);
  return { gpa: c.gpa, result_status: result.result_status === "Withheld" ? "Withheld" : c.status };
}

/** Attendance helper: "180/200" → { present, total, percent }. */
export function attendanceOf(present: number | null, total: number | null) {
  if (present === null || total === null || total <= 0) return null;
  return { present, total, percent: round2((present / total) * 100) };
}

/** Optional default scheme for a fresh batch, editable in the batch form. */
export const DEFAULT_SUBJECTS: SubjectDef[] = [
  { name: "English", full_marks: 100, pass_marks: 35 },
  { name: "Nepali", full_marks: 100, pass_marks: 35 },
  { name: "Mathematics", full_marks: 100, pass_marks: 35 },
  { name: "Science", full_marks: 100, pass_marks: 35 },
  { name: "Social Studies", full_marks: 100, pass_marks: 35 },
  { name: "Computer Science", full_marks: 100, pass_marks: 35 },
];
