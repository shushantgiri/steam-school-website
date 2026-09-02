/** Pure, environment-free pieces of the results system, safe in the browser. */

export type ResultStatus = "Passed" | "Failed" | "Withheld";
export const RESULT_STATUSES: ResultStatus[] = ["Passed", "Failed", "Withheld"];

/**
 * A result batch is the folder a set of results lives in — one class, one
 * examination, one academic year, one title ("Annual Examination Result
 * 2082"). Publishing happens at the batch level: families can only ever find
 * results whose batch is published.
 */
/**
 * One subject in a batch's marksheet scheme. Every result in the batch is
 * marked against the same subjects, so the marksheet table lines up.
 */
export type SubjectDef = {
  name: string;        // "Mathematics"
  full_marks: number;  // e.g. 100
  pass_marks: number;  // e.g. 35
};

export type ResultBatch = {
  id: string;
  title: string;
  class: string;             // class name from Academic Setup
  examination_name: string;
  academic_year: string;     // BS year, e.g. "2082"
  description: string;
  subjects: SubjectDef[];    // empty → GPA-only batch (no marksheet)
  issue_date_bs: string;     // marksheet "Date of Issue" (BS); "" → publish date
  published: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

export type BatchWithCount = ResultBatch & { student_count: number };

export type ExamResult = {
  id: string;
  batch_id: string;
  student_name: string;
  student_name_normalized: string;
  date_of_birth_bs: string;         // "2068-04-15" (Bikram Sambat)
  date_of_birth_ad: string;         // same day in AD, for reliable date handling
  roll_number: string;
  section: string;
  attendance_present: number | null; // days present (optional)
  attendance_total: number | null;   // working days (optional)
  marks: Record<string, number | null>; // subject name → marks obtained
  gpa: number;                      // computed from marks when the batch has subjects
  result_status: ResultStatus;
  remarks: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

export type ResultPage = { rows: ExamResult[]; total: number };
export type BatchPage = { rows: BatchWithCount[]; total: number };

/** "  Ram  Bahadur SHARMA " → "ram bahadur sharma" — one spelling to match on. */
export const normalizeName = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

/** Fill in fields older records (pre-marksheet) don't have. */
export function withBatchDefaults<T extends Partial<ResultBatch>>(b: T): T & Pick<ResultBatch, "subjects" | "issue_date_bs"> {
  return {
    ...b,
    subjects: Array.isArray(b.subjects) ? b.subjects : [],
    issue_date_bs: typeof b.issue_date_bs === "string" ? b.issue_date_bs : "",
  };
}
export function withResultDefaults<T extends Partial<ExamResult>>(r: T): T & Pick<ExamResult, "roll_number" | "section" | "attendance_present" | "attendance_total" | "marks"> {
  return {
    ...r,
    roll_number: typeof r.roll_number === "string" ? r.roll_number : "",
    section: typeof r.section === "string" ? r.section : "",
    attendance_present: typeof r.attendance_present === "number" ? r.attendance_present : null,
    attendance_total: typeof r.attendance_total === "number" ? r.attendance_total : null,
    marks: r.marks && typeof r.marks === "object" ? r.marks : {},
  };
}

/** Sanitize a subjects list from user input (admin form / API). */
export function normalizeSubjects(input: unknown): SubjectDef[] {
  if (!Array.isArray(input)) return [];
  const out: SubjectDef[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim().replace(/\s+/g, " ").slice(0, 60) : "";
    const full = Number(o.full_marks);
    const pass = Number(o.pass_marks);
    if (!name || seen.has(name.toLowerCase())) continue;
    if (!Number.isFinite(full) || full <= 0 || full > 1000) continue;
    if (!Number.isFinite(pass) || pass < 0 || pass > full) continue;
    seen.add(name.toLowerCase());
    out.push({ name, full_marks: Math.round(full), pass_marks: Math.round(pass) });
  }
  return out.slice(0, 20);
}
