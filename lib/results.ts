import { promises as fs } from "fs";
import path from "path";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";
import {
  normalizeName,
  type BatchPage,
  type BatchWithCount,
  type ExamResult,
  type ResultBatch,
  type ResultPage,
  type ResultStatus,
} from "./results-shared";

export { RESULT_STATUSES, normalizeName, normalizeSubjects, withBatchDefaults, withResultDefaults } from "./results-shared";
export type { BatchPage, BatchWithCount, ExamResult, ResultBatch, ResultPage, ResultStatus, SubjectDef } from "./results-shared";
import { withBatchDefaults, withResultDefaults } from "./results-shared";
import { computeFromMarks, hasMarksheet, type Computed } from "./grading";

/**
 * Examination results — the one dataset here that names real children, so it
 * gets the strictest handling in the project.
 *
 * Results are organised into BATCHES (one class + examination + academic
 * year, e.g. "Annual Examination Result 2082 · Grade 8"). Staff manage
 * batches; publishing a batch is what makes its results findable. The public
 * can only ever fetch a single record by exact name + BS date of birth +
 * class, through a rate-limited server endpoint. Browsing, listing or bulk
 * reading is staff-only.
 *
 * Storage follows the rest of the project: JSON files in local mode,
 * `result_batches` + `exam_results` tables in Supabase mode. Lists are always
 * paginated and filtered on the server — never "everything to the browser".
 */

const RESULTS_FILE = path.join(process.cwd(), "data", "results.json");
const BATCHES_FILE = path.join(process.cwd(), "data", "result-batches.json");

let chain: Promise<unknown> = Promise.resolve();
const serialize = <T,>(task: () => Promise<T>): Promise<T> => {
  const run = chain.then(task, task);
  chain = run.catch(() => undefined);
  return run;
};

async function readArr<T>(file: string): Promise<T[]> {
  try { return JSON.parse(await fs.readFile(file, "utf8")) as T[]; } catch { return []; }
}
const writeArr = (file: string, rows: unknown[]) =>
  serialize(async () => {
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(rows, null, 2) + "\n", "utf8");
    await fs.rename(tmp, file);
  });

const localBatches = async () => (await readArr<ResultBatch>(BATCHES_FILE)).map((b) => withBatchDefaults(b) as ResultBatch);
const localResults = async () => (await readArr<ExamResult>(RESULTS_FILE)).map((r) => withResultDefaults(r) as ExamResult);

const now = () => new Date().toISOString();

/* ------------------------------- Batches -------------------------------- */

export type BatchQuery = {
  page: number;
  pageSize: number;
  search?: string;      // matches title
  klass?: string;
  year?: string;
  exam?: string;
  status?: "Published" | "Draft";
};

export async function listBatches(q: BatchQuery): Promise<BatchPage> {
  const from = (q.page - 1) * q.pageSize;
  if (isSupabaseConfigured()) {
    let query = supabaseAdmin()
      .from("result_batches")
      .select("*, exam_results(count)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + q.pageSize - 1);
    if (q.search) query = query.ilike("title", `%${q.search.trim()}%`);
    if (q.klass) query = query.eq("class", q.klass);
    if (q.year) query = query.eq("academic_year", q.year);
    if (q.exam) query = query.eq("examination_name", q.exam);
    if (q.status) query = query.eq("published", q.status === "Published");
    const { data, error, count } = await query;
    if (error) throw new Error(`Could not load result batches: ${error.message}`);
    const rows = (data ?? []).map((b) => {
      const { exam_results, ...batch } = b as ResultBatch & { exam_results: Array<{ count: number }> };
      return { ...batch, student_count: exam_results?.[0]?.count ?? 0 } as BatchWithCount;
    });
    return { rows, total: count ?? 0 };
  }

  let rows = (await localBatches()).sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (q.search) { const s = q.search.trim().toLowerCase(); rows = rows.filter((b) => b.title.toLowerCase().includes(s)); }
  if (q.klass) rows = rows.filter((b) => b.class === q.klass);
  if (q.year) rows = rows.filter((b) => b.academic_year === q.year);
  if (q.exam) rows = rows.filter((b) => b.examination_name === q.exam);
  if (q.status) rows = rows.filter((b) => b.published === (q.status === "Published"));
  const counts = new Map<string, number>();
  for (const r of await localResults()) counts.set(r.batch_id, (counts.get(r.batch_id) ?? 0) + 1);
  return {
    rows: rows.slice(from, from + q.pageSize).map((b) => ({ ...b, student_count: counts.get(b.id) ?? 0 })),
    total: rows.length,
  };
}

export async function getBatch(id: string): Promise<BatchWithCount | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseAdmin()
      .from("result_batches").select("*, exam_results(count)").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const { exam_results, ...batch } = data as ResultBatch & { exam_results: Array<{ count: number }> };
    return { ...(withBatchDefaults(batch) as ResultBatch), student_count: exam_results?.[0]?.count ?? 0 };
  }
  const batch = (await localBatches()).find((b) => b.id === id);
  if (!batch) return null;
  const student_count = (await localResults()).filter((r) => r.batch_id === id).length;
  return { ...batch, student_count };
}

export type BatchFields = Pick<ResultBatch, "title" | "class" | "examination_name" | "academic_year" | "description" | "subjects" | "issue_date_bs">;

export async function createBatch(fields: BatchFields, actor: string): Promise<ResultBatch> {
  const batch: ResultBatch = {
    id: crypto.randomUUID(),
    ...fields,
    published: false,
    created_by: actor,
    updated_by: actor,
    created_at: now(),
    updated_at: now(),
  };
  if (isSupabaseConfigured()) {
    const { error } = await supabaseAdmin().from("result_batches").insert(batch);
    if (error) throw new Error(error.message);
    return batch;
  }
  const all = await localBatches();
  all.unshift(batch);
  await writeArr(BATCHES_FILE, all);
  return batch;
}

export async function patchBatch(
  id: string,
  fields: Partial<BatchFields & { published: boolean }>,
  actor: string
): Promise<ResultBatch | null> {
  const clean = { ...fields, updated_by: actor, updated_at: now() };
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseAdmin()
      .from("result_batches").update(clean).eq("id", id).select().maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ResultBatch) ?? null;
  }
  const all = await localBatches();
  const i = all.findIndex((b) => b.id === id);
  if (i === -1) return null;
  all[i] = { ...all[i], ...clean };
  await writeArr(BATCHES_FILE, all);
  return all[i];
}

/** Deleting a batch removes the batch and every result inside it. */
export async function deleteBatch(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    // exam_results.batch_id has ON DELETE CASCADE — one delete is enough.
    const { error, count } = await supabaseAdmin()
      .from("result_batches").delete({ count: "exact" }).eq("id", id);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  }
  const batches = await localBatches();
  const next = batches.filter((b) => b.id !== id);
  if (next.length === batches.length) return false;
  await writeArr(BATCHES_FILE, next);
  await writeArr(RESULTS_FILE, (await localResults()).filter((r) => r.batch_id !== id));
  return true;
}

/* ------------------------------- Results --------------------------------- */

export type ResultQuery = { page: number; pageSize: number; search?: string };

/** Results inside one batch — paginated and searched on the server. */
export async function listBatchResults(batchId: string, q: ResultQuery): Promise<ResultPage> {
  const from = (q.page - 1) * q.pageSize;
  if (isSupabaseConfigured()) {
    let query = supabaseAdmin()
      .from("exam_results")
      .select("*", { count: "exact" })
      .eq("batch_id", batchId)
      .order("student_name_normalized", { ascending: true })
      .range(from, from + q.pageSize - 1);
    if (q.search) query = query.ilike("student_name_normalized", `%${normalizeName(q.search)}%`);
    const { data, error, count } = await query;
    if (error) throw new Error(`Could not load results: ${error.message}`);
    return { rows: ((data ?? []) as ExamResult[]).map((r) => withResultDefaults(r) as ExamResult), total: count ?? 0 };
  }
  let rows = (await localResults())
    .filter((r) => r.batch_id === batchId)
    .sort((a, b) => a.student_name_normalized.localeCompare(b.student_name_normalized));
  if (q.search) rows = rows.filter((r) => r.student_name_normalized.includes(normalizeName(q.search!)));
  return { rows: rows.slice(from, from + q.pageSize), total: rows.length };
}

/** Every row of one batch, for CSV export (staff only; streams from the DB in pages). */
export async function allBatchResults(batchId: string): Promise<ExamResult[]> {
  if (isSupabaseConfigured()) {
    const out: ExamResult[] = [];
    const pageSize = 1000;
    for (let page = 1; ; page++) {
      const { rows } = await listBatchResults(batchId, { page, pageSize });
      out.push(...rows);
      if (rows.length < pageSize) break;
    }
    return out;
  }
  return (await localResults())
    .filter((r) => r.batch_id === batchId)
    .sort((a, b) => a.student_name_normalized.localeCompare(b.student_name_normalized));
}

/** Same student (name + BS DOB) may appear once per batch. */
const identityOf = (r: Pick<ExamResult, "student_name_normalized" | "date_of_birth_bs">) =>
  `${r.student_name_normalized}|${r.date_of_birth_bs}`;

export type ImportRow = Pick<
  ExamResult,
  | "student_name" | "student_name_normalized" | "date_of_birth_bs" | "date_of_birth_ad"
  | "roll_number" | "section" | "attendance_present" | "attendance_total" | "marks"
  | "gpa" | "result_status" | "remarks"
>;
export type ImportMode = "skip" | "update";
export type ImportOutcome = { inserted: number; updated: number; skipped: number };

/** How many of these rows already exist in the batch — for the pre-import prompt. */
export async function countBatchDuplicates(batchId: string, rows: ImportRow[]): Promise<number> {
  const existing = await existingIdentities(batchId);
  return rows.filter((r) => existing.has(identityOf(r))).length;
}

async function existingIdentities(batchId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>(); // identity → result id
  if (isSupabaseConfigured()) {
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabaseAdmin()
        .from("exam_results")
        .select("id, student_name_normalized, date_of_birth_bs")
        .eq("batch_id", batchId)
        .range(from, from + pageSize - 1);
      if (error) throw new Error(error.message);
      for (const r of data ?? []) map.set(identityOf(r as ExamResult), (r as ExamResult).id);
      if ((data ?? []).length < pageSize) break;
    }
    return map;
  }
  for (const r of await localResults()) {
    if (r.batch_id === batchId) map.set(identityOf(r), r.id);
  }
  return map;
}

/**
 * Bulk import into a batch with explicit duplicate handling — a student
 * already recorded in the batch is never silently overwritten.
 */
export async function importIntoBatch(
  batchId: string,
  rows: ImportRow[],
  mode: ImportMode,
  actor: string
): Promise<ImportOutcome> {
  const outcome: ImportOutcome = { inserted: 0, updated: 0, skipped: 0 };
  const existing = await existingIdentities(batchId);

  const inserts: ExamResult[] = [];
  const updates: Array<{ id: string; row: ImportRow }> = [];
  for (const row of rows) {
    const id = existing.get(identityOf(row));
    if (id) {
      if (mode === "update") { updates.push({ id, row }); outcome.updated++; }
      else outcome.skipped++;
    } else {
      const rec: ExamResult = {
        ...row,
        id: crypto.randomUUID(),
        batch_id: batchId,
        created_by: actor,
        updated_by: actor,
        created_at: now(),
        updated_at: now(),
      };
      existing.set(identityOf(rec), rec.id);
      inserts.push(rec);
      outcome.inserted++;
    }
  }

  if (isSupabaseConfigured()) {
    for (let i = 0; i < inserts.length; i += 500) {
      const { error } = await supabaseAdmin().from("exam_results").insert(inserts.slice(i, i + 500));
      if (error) throw new Error(error.message);
    }
    for (const u of updates) {
      const { error } = await supabaseAdmin()
        .from("exam_results")
        .update({ ...u.row, updated_by: actor, updated_at: now() })
        .eq("id", u.id);
      if (error) throw new Error(error.message);
    }
    await patchBatch(batchId, {}, actor); // bump updated_at/by
    return outcome;
  }

  const all = await localResults();
  const byId = new Map(all.map((r) => [r.id, r]));
  for (const u of updates) {
    const target = byId.get(u.id);
    if (target) Object.assign(target, u.row, { updated_by: actor, updated_at: now() });
  }
  all.push(...inserts);
  await writeArr(RESULTS_FILE, all);
  await patchBatch(batchId, {}, actor);
  return outcome;
}

export async function createResult(
  batchId: string,
  row: ImportRow,
  actor: string
): Promise<{ ok: true } | { ok: false; duplicate: true }> {
  const res = await importIntoBatch(batchId, [row], "skip", actor);
  return res.inserted === 1 ? { ok: true } : { ok: false, duplicate: true };
}

export async function patchResult(id: string, fields: Partial<ExamResult>, actor: string): Promise<ExamResult | null> {
  const clean = { ...fields, updated_by: actor, updated_at: now() };
  delete (clean as Record<string, unknown>).id;
  delete (clean as Record<string, unknown>).batch_id;
  delete (clean as Record<string, unknown>).created_at;
  delete (clean as Record<string, unknown>).created_by;
  if (typeof clean.student_name === "string") {
    clean.student_name_normalized = normalizeName(clean.student_name);
  }
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseAdmin().from("exam_results").update(clean).eq("id", id).select().maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ExamResult) ?? null;
  }
  const all = await localResults();
  const i = all.findIndex((r) => r.id === id);
  if (i === -1) return null;
  all[i] = { ...all[i], ...clean } as ExamResult;
  await writeArr(RESULTS_FILE, all);
  return all[i];
}

/** Load one raw result row (staff use). */
export async function getResult(id: string): Promise<ExamResult | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseAdmin().from("exam_results").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? (withResultDefaults(data as ExamResult) as ExamResult) : null;
  }
  return (await localResults()).find((r) => r.id === id) ?? null;
}

/**
 * Edit a result and keep its stored GPA/status consistent with the batch's
 * marks scheme — a changed mark must never leave a stale GPA behind.
 */
export async function patchResultWithScheme(id: string, fields: Partial<ExamResult>, actor: string): Promise<ExamResult | null> {
  const current = await getResult(id);
  if (!current) return null;
  const batch = await getBatch(current.batch_id);
  if (!batch) return null;
  const merged: ExamResult = { ...current, ...fields };
  if (hasMarksheet(batch)) {
    const c = computeFromMarks(batch.subjects, merged.marks);
    fields = { ...fields, gpa: c.gpa, result_status: merged.result_status === "Withheld" ? "Withheld" : c.status };
  }
  return patchResult(id, fields, actor);
}

export async function deleteResult(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error, count } = await supabaseAdmin().from("exam_results").delete({ count: "exact" }).eq("id", id);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  }
  const all = await localResults();
  const next = all.filter((r) => r.id !== id);
  if (next.length === all.length) return false;
  await writeArr(RESULTS_FILE, next);
  return true;
}

/** Dashboard numbers. */
export async function countResults(): Promise<{ batches: number; published: number; students: number }> {
  if (isSupabaseConfigured()) {
    const [b, p, s] = await Promise.all([
      supabaseAdmin().from("result_batches").select("id", { count: "exact", head: true }),
      supabaseAdmin().from("result_batches").select("id", { count: "exact", head: true }).eq("published", true),
      supabaseAdmin().from("exam_results").select("id", { count: "exact", head: true }),
    ]);
    return { batches: b.count ?? 0, published: p.count ?? 0, students: s.count ?? 0 };
  }
  const batches = await localBatches();
  return {
    batches: batches.length,
    published: batches.filter((b) => b.published).length,
    students: (await localResults()).length,
  };
}

/* ---------------------------- Public search ------------------------------ */

export type PublicResult = {
  id: string;                  // result id — paired with a signed token for the marksheet
  student_name: string;
  date_of_birth_bs: string;
  class: string;
  section: string;
  roll_number: string;
  gpa: number;
  result_status: ResultStatus;
  remarks: string;
  batch_title: string;
  examination_name: string;
  academic_year: string;
  has_marksheet: boolean;
  subjects: Array<{ name: string; full_marks: number; obtained: number | null; grade: string; point: number }>;
  percentage: number | null;
};

const publicSubjects = (batch: Pick<ResultBatch, "subjects">, r: ExamResult) => {
  if (!hasMarksheet(batch)) return { has_marksheet: false, subjects: [], percentage: null as number | null };
  const c = computeFromMarks(batch.subjects, r.marks);
  return {
    has_marksheet: true,
    subjects: c.rows.map((x) => ({ name: x.name, full_marks: x.full_marks, obtained: x.obtained, grade: x.grade, point: x.point })),
    percentage: c.percentage,
  };
};

/**
 * The ONLY public read path: exact name + BS date of birth + class, results
 * whose batch is published, newest academic year first, minimal fields.
 */
export async function findPublicResult(input: {
  name: string; dobBs: string; klass: string; year?: string;
}): Promise<PublicResult | null> {
  const normalized = normalizeName(input.name);

  if (isSupabaseConfigured()) {
    let q = supabaseAdmin()
      .from("exam_results")
      .select(
        "id, student_name, date_of_birth_bs, section, roll_number, marks, gpa, result_status, remarks, result_batches!inner(title, class, examination_name, academic_year, published, subjects)"
      )
      .eq("student_name_normalized", normalized)
      .eq("date_of_birth_bs", input.dobBs)
      .eq("result_batches.class", input.klass)
      .eq("result_batches.published", true)
      .limit(20);
    if (input.year) q = q.eq("result_batches.academic_year", input.year);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    type Joined = ExamResult & { result_batches: Pick<ResultBatch, "title" | "class" | "examination_name" | "academic_year" | "subjects"> };
    const hit = ((data ?? []) as unknown as Joined[])
      .sort((a, b) => b.result_batches.academic_year.localeCompare(a.result_batches.academic_year))[0];
    if (!hit) return null;
    const r = withResultDefaults(hit) as ExamResult;
    const b = withBatchDefaults(hit.result_batches);
    return {
      id: r.id,
      student_name: r.student_name,
      date_of_birth_bs: r.date_of_birth_bs,
      class: b.class,
      section: r.section,
      roll_number: r.roll_number,
      gpa: r.gpa,
      result_status: r.result_status,
      remarks: r.remarks,
      batch_title: b.title,
      examination_name: b.examination_name,
      academic_year: b.academic_year,
      ...publicSubjects(b, r),
    };
  }

  const batches = new Map((await localBatches()).filter((b) => b.published).map((b) => [b.id, b]));
  const hit = (await localResults())
    .filter((r) => {
      const b = batches.get(r.batch_id);
      return (
        !!b &&
        r.student_name_normalized === normalized &&
        r.date_of_birth_bs === input.dobBs &&
        b.class === input.klass &&
        (!input.year || b.academic_year === input.year)
      );
    })
    .sort((a, b) => batches.get(b.batch_id)!.academic_year.localeCompare(batches.get(a.batch_id)!.academic_year))[0];
  if (!hit) return null;
  const b = batches.get(hit.batch_id)!;
  return {
    id: hit.id,
    student_name: hit.student_name,
    date_of_birth_bs: hit.date_of_birth_bs,
    class: b.class,
    section: hit.section,
    roll_number: hit.roll_number,
    gpa: hit.gpa,
    result_status: hit.result_status,
    remarks: hit.remarks,
    batch_title: b.title,
    examination_name: b.examination_name,
    academic_year: b.academic_year,
    ...publicSubjects(b, hit),
  };
}

/* ------------------------------ Marksheet -------------------------------- */

export type MarksheetRecord = {
  batch: ResultBatch;
  result: ExamResult;
  computed: Computed;
  /** Position by total marks within the batch (1 = highest); ties share a rank. */
  rank: { position: number; of: number } | null;
};

/**
 * One result with its batch and the fully graded table. `requirePublished`
 * is set for public access; staff can view marksheets of draft batches.
 */
export async function getMarksheet(resultId: string, requirePublished: boolean): Promise<MarksheetRecord | null> {
  let result: ExamResult | null = null;
  let batch: ResultBatch | null = null;
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseAdmin().from("exam_results").select("*").eq("id", resultId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    result = withResultDefaults(data as ExamResult) as ExamResult;
    const b = await getBatch(result.batch_id);
    batch = b;
  } else {
    result = (await localResults()).find((r) => r.id === resultId) ?? null;
    if (!result) return null;
    batch = (await localBatches()).find((b) => b.id === result!.batch_id) ?? null;
  }
  if (!result || !batch) return null;
  if (requirePublished && !batch.published) return null;
  if (!hasMarksheet(batch)) return null;
  const computed = computeFromMarks(batch.subjects, result.marks);

  // Rank among every result of the batch by total marks obtained.
  let rank: MarksheetRecord["rank"] = null;
  try {
    const all = await allBatchResults(batch.id);
    const totals = all.map((r) => computeFromMarks(batch.subjects, r.marks).total_obtained).sort((a, b) => b - a);
    const position = totals.findIndex((t) => t <= computed.total_obtained) + 1;
    if (position > 0) rank = { position, of: totals.length };
  } catch { rank = null; }

  return { batch, result, computed, rank };
}
