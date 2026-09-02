import { promises as fs } from "fs";
import path from "path";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";

/**
 * Storage for the CMS content documents (news, notices, events, settings,
 * gallery). Two interchangeable backends behind one API:
 *
 *   • JSON files in /data           — zero-config local mode
 *   • Supabase `cms_documents`      — production mode (key → jsonb row)
 *
 * The backend is chosen per call from the environment, so setting the
 * Supabase variables and restarting is the entire switch. High-volume
 * per-row records (applications, messages, activity) do NOT go through
 * here — see lib/records.ts, which uses real relational tables.
 *
 * Server-only (Node runtime): never import from a client component — client
 * code talks to the /api routes instead.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const TABLE = "cms_documents";

/** Writes are serialized so two concurrent edits can't lose each other. */
let chain: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.catch(() => undefined);
  return run;
}

/* ------------------------------- JSON mode ------------------------------- */

async function readFileJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
  return JSON.parse(raw) as T;
}

async function writeFileJson(file: string, value: unknown): Promise<void> {
  const target = path.join(DATA_DIR, file);
  // Write beside the target and rename, so a crash mid-write can't truncate
  // the file that everything else is reading.
  const tmp = `${target}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2) + "\n", "utf8");
  await fs.rename(tmp, target);
}

/* ----------------------------- Supabase mode ----------------------------- */

const docKey = (file: string) => file.replace(/\.json$/, "");

async function readDbJson<T>(file: string): Promise<T> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE).select("data").eq("key", docKey(file)).maybeSingle();
  if (error) throw new Error(`Supabase read failed for ${file}: ${error.message}`);
  if (data?.data === undefined || data?.data === null) {
    // Fall back to the seed shipped with the repo so a fresh database still
    // renders; `npm run seed:supabase` copies the seeds in properly.
    return readFileJson<T>(file);
  }
  return data.data as T;
}

async function writeDbJson(file: string, value: unknown): Promise<void> {
  const { error } = await supabaseAdmin()
    .from(TABLE)
    .upsert({ key: docKey(file), data: value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(`Supabase write failed for ${file}: ${error.message}`);
}

/* -------------------------------- Facade -------------------------------- */

export function readJson<T>(file: string): Promise<T> {
  return isSupabaseConfigured() ? readDbJson<T>(file) : readFileJson<T>(file);
}

export function writeJson(file: string, value: unknown): Promise<void> {
  return serialize(() =>
    isSupabaseConfigured() ? writeDbJson(file, value) : writeFileJson(file, value)
  );
}

/** Read-modify-write under the write lock — use this for every mutation. */
export function updateJson<T>(file: string, mutate: (current: T) => T | Promise<T>): Promise<T> {
  return serialize(async () => {
    const current = isSupabaseConfigured() ? await readDbJson<T>(file) : await readFileJson<T>(file);
    const next = await mutate(current);
    if (isSupabaseConfigured()) await writeDbJson(file, next);
    else await writeFileJson(file, next);
    return next;
  });
}
