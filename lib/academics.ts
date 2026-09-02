import { readJson, writeJson } from "./store";

/**
 * The single source of truth for classes, examination types and academic
 * years. Everything that mentions a class — result upload, the public result
 * form, filters, academic pages — reads from here, so renaming "Grade 8"
 * happens in exactly one place. Stored through the store facade: a JSON file
 * in local mode, a `cms_documents` row in Supabase mode.
 */

export type SchoolClass = { id: string; name: string; enabled: boolean };

export type AcademicSetup = {
  classes: SchoolClass[];
  examinations: string[];
  academicYears: string[]; // BS years, e.g. "2082"
};

export const ACADEMICS_FILE = "academics.json";

export const ACADEMICS_DEFAULTS: AcademicSetup = {
  classes: [
    "Nursery", "LKG", "UKG",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
    "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10",
  ].map((name, i) => ({ id: `c${i + 1}`, name, enabled: true })),
  examinations: [
    "First Terminal Examination",
    "Second Terminal Examination",
    "Mid-Term Examination",
    "Annual Examination",
    "Final Examination",
  ],
  academicYears: ["2080", "2081", "2082", "2083"],
};

/** Merge stored data over the defaults — missing or malformed parts fall back. */
export function normalizeAcademics(raw: unknown): AcademicSetup {
  const out: AcademicSetup = JSON.parse(JSON.stringify(ACADEMICS_DEFAULTS));
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;

  if (Array.isArray(src.classes)) {
    const classes: SchoolClass[] = [];
    for (const item of src.classes) {
      if (!item || typeof item !== "object") continue;
      const c = item as Record<string, unknown>;
      const name = typeof c.name === "string" ? c.name.trim().slice(0, 40) : "";
      if (!name) continue;
      classes.push({
        id: typeof c.id === "string" && c.id ? c.id : crypto.randomUUID(),
        name,
        enabled: c.enabled !== false,
      });
    }
    if (classes.length > 0) out.classes = classes;
  }

  if (Array.isArray(src.examinations)) {
    const exams = src.examinations
      .filter((e): e is string => typeof e === "string" && e.trim() !== "")
      .map((e) => e.trim().slice(0, 60));
    if (exams.length > 0) out.examinations = Array.from(new Set(exams));
  }

  if (Array.isArray(src.academicYears)) {
    const years = src.academicYears
      .filter((y): y is string => typeof y === "string" && /^\d{4}$/.test(y.trim()))
      .map((y) => y.trim());
    if (years.length > 0) out.academicYears = Array.from(new Set(years)).sort().reverse();
  }
  return out;
}

export async function getAcademics(): Promise<AcademicSetup> {
  try {
    return normalizeAcademics(await readJson<unknown>(ACADEMICS_FILE));
  } catch {
    return JSON.parse(JSON.stringify(ACADEMICS_DEFAULTS));
  }
}

export async function saveAcademics(raw: unknown): Promise<AcademicSetup> {
  const clean = normalizeAcademics(raw);
  await writeJson(ACADEMICS_FILE, clean);
  return clean;
}

/** Class names shown to families and offered in upload forms. */
export const enabledClassNames = (setup: AcademicSetup): string[] =>
  setup.classes.filter((c) => c.enabled).map((c) => c.name);
