import { RESULT_STATUSES, normalizeName, type ExamResult, type ResultStatus, type SubjectDef } from "./results-shared";
import { bsToAd, isValidBs } from "./bs-calendar";
import { computeFromMarks } from "./grading";

/**
 * CSV parsing + validation for examination results, shared by the upload
 * preview (client) and the import endpoint (server) so both judge rows by
 * exactly the same rules. Handles quoted fields, commas inside quotes, CRLF.
 *
 * The CSV holds only per-student columns — class, examination, academic year
 * and the batch title come from Step 1 of the upload, never from the file.
 * `date_of_birth` is a Bikram Sambat date (e.g. 2068-04-15), NOT Gregorian.
 */

/** Fixed columns. With a marks scheme, one extra column per subject follows. */
export const CSV_COLUMNS = [
  "student_name",
  "date_of_birth",
  "roll_number",
  "section",
  "attendance",
  "gpa",
  "result_status",
  "remarks",
] as const;
type Col = (typeof CSV_COLUMNS)[number];

/** Which fixed columns are mandatory in a file for this batch. */
const requiredColumns = (subjects: SubjectDef[]): Col[] =>
  subjects.length > 0 ? ["student_name", "date_of_birth"] : ["student_name", "date_of_birth", "gpa"];

/**
 * A template that matches the batch: subject columns are named exactly as
 * the batch's subjects; GPA/status are computed and therefore omitted.
 */
export function csvTemplate(subjects: SubjectDef[]): string {
  if (subjects.length === 0) {
    return (
      "student_name,date_of_birth,roll_number,section,attendance,gpa,result_status,remarks\n" +
      "Ram Sharma,2068-04-15,1,A,180/200,3.65,Passed,Excellent\n" +
      "Sita Thapa,2068-07-20,2,A,192/200,3.82,Passed,Very Good\n"
    );
  }
  const head = ["student_name", "date_of_birth", "roll_number", "section", "attendance", ...subjects.map((x) => x.name), "remarks"];
  const demo = (name: string, dob: string, roll: number, base: number) =>
    [name, dob, String(roll), "A", "180/200", ...subjects.map((x, i) => String(Math.min(x.full_marks, Math.round(x.full_marks * (base - i * 0.03))))), ""].join(",");
  return head.join(",") + "\n" + demo("Ram Sharma", "2068-04-15", 1, 0.86) + "\n" + demo("Sita Thapa", "2068-07-20", 2, 0.93) + "\n";
}

/** Legacy export kept for older imports of this module. */
export const CSV_TEMPLATE = csvTemplate([]);

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "", row: string[] = [], inQuotes = false;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") pushField();
    else if (c === "\n") pushRow();
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length > 0) pushRow();
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export type RowIssue = { row: number; problem: string };
export type ValidRow = Pick<
  ExamResult,
  | "student_name" | "student_name_normalized" | "date_of_birth_bs" | "date_of_birth_ad"
  | "roll_number" | "section" | "attendance_present" | "attendance_total" | "marks"
  | "gpa" | "result_status" | "remarks"
>;
export type CsvReport = {
  header_ok: boolean;
  missing_columns: string[];
  valid: ValidRow[];
  issues: RowIssue[];
};

/** "180/200" → [180, 200]; "" → [null, null]; anything else → invalid. */
export function parseAttendance(raw: string): [number | null, number | null] | "invalid" {
  const t = raw.trim();
  if (!t) return [null, null];
  const m = t.match(/^(\d{1,4})\s*\/\s*(\d{1,4})$/);
  if (!m) return "invalid";
  const present = Number(m[1]), total = Number(m[2]);
  if (total <= 0 || present > total) return "invalid";
  return [present, total];
}

/**
 * Validate parsed CSV rows against the batch's scheme; row numbers reported
 * are 1-based including the header. With subjects, marks are validated per
 * subject and GPA/status are computed; without, the GPA column is required.
 */
export function validateCsv(rows: string[][], subjects: SubjectDef[] = []): CsvReport {
  const report: CsvReport = { header_ok: false, missing_columns: [], valid: [], issues: [] };
  if (rows.length === 0) return report;

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const index: Partial<Record<Col, number>> = {};
  for (const col of CSV_COLUMNS) {
    const i = header.indexOf(col);
    if (i !== -1) index[col] = i;
  }
  for (const col of requiredColumns(subjects)) if (index[col] === undefined) report.missing_columns.push(col);

  // Subject columns: matched by name, case-insensitively.
  const subjectIndex = new Map<string, number>();
  for (const sub of subjects) {
    const i = header.indexOf(sub.name.toLowerCase());
    if (i === -1) report.missing_columns.push(sub.name);
    else subjectIndex.set(sub.name, i);
  }

  report.header_ok = report.missing_columns.length === 0;
  if (!report.header_ok) return report;

  const cell = (r: string[], col: Col) => (index[col] === undefined ? "" : (r[index[col]!] ?? "").trim());
  const seen = new Map<string, number>(); // duplicate rows inside the same file

  for (let n = 1; n < rows.length; n++) {
    const r = rows[n];
    const rowNo = n + 1;
    const name = cell(r, "student_name");
    const dob = cell(r, "date_of_birth");
    const roll = cell(r, "roll_number").slice(0, 20);
    const section = cell(r, "section").slice(0, 10);
    const attendance = parseAttendance(cell(r, "attendance"));
    const statusRaw = cell(r, "result_status");
    const remarks = cell(r, "remarks");

    if (!name || name.length > 80) { report.issues.push({ row: rowNo, problem: "Student name is missing." }); continue; }
    if (!isValidBs(dob)) {
      report.issues.push({ row: rowNo, problem: `Invalid BS date of birth "${dob}" — use YYYY-MM-DD in Bikram Sambat, e.g. 2068-04-15.` });
      continue;
    }
    if (attendance === "invalid") {
      report.issues.push({ row: rowNo, problem: `Invalid attendance "${cell(r, "attendance")}" — write days present / working days, e.g. 180/200.` });
      continue;
    }

    let gpa = 0;
    let status: ResultStatus;
    const marks: Record<string, number | null> = {};

    if (subjects.length > 0) {
      let bad = false;
      for (const sub of subjects) {
        const raw = (r[subjectIndex.get(sub.name)!] ?? "").trim();
        if (raw === "" || /^(ab|absent|a)$/i.test(raw)) { marks[sub.name] = null; continue; }
        const v = Number(raw);
        if (!Number.isFinite(v) || v < 0 || v > sub.full_marks) {
          report.issues.push({ row: rowNo, problem: `Invalid marks "${raw}" for ${sub.name} — must be 0 to ${sub.full_marks} (or blank/AB for absent).` });
          bad = true;
          break;
        }
        marks[sub.name] = Math.round(v * 100) / 100;
      }
      if (bad) continue;
      const c = computeFromMarks(subjects, marks);
      gpa = c.gpa;
      status = statusRaw === "Withheld" ? "Withheld" : c.status;
    } else {
      const gpaRaw = cell(r, "gpa");
      const g = Number(gpaRaw);
      if (!gpaRaw || Number.isNaN(g) || g < 0 || g > 4) {
        report.issues.push({ row: rowNo, problem: `Invalid GPA "${gpaRaw}" — must be between 0 and 4.` });
        continue;
      }
      gpa = Math.round(g * 100) / 100;
      const st = statusRaw || "Passed";
      if (!(RESULT_STATUSES as string[]).includes(st)) {
        report.issues.push({ row: rowNo, problem: `Invalid result status "${st}" — use Passed, Failed or Withheld.` });
        continue;
      }
      status = st as ResultStatus;
    }

    const identity = `${normalizeName(name)}|${dob}`;
    const firstAt = seen.get(identity);
    if (firstAt) {
      report.issues.push({ row: rowNo, problem: `Duplicate of row ${firstAt} (same student name and date of birth).` });
      continue;
    }
    seen.set(identity, rowNo);

    report.valid.push({
      student_name: name,
      student_name_normalized: normalizeName(name),
      date_of_birth_bs: dob,
      date_of_birth_ad: bsToAd(dob) ?? "",
      roll_number: roll,
      section,
      attendance_present: attendance[0],
      attendance_total: attendance[1],
      marks,
      gpa,
      result_status: status,
      remarks: remarks.slice(0, 300),
    });
  }
  return report;
}
