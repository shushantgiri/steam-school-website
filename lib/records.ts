import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";

/**
 * Per-row records: admission applications, contact messages, and the admin
 * activity log. Unlike the content documents these are append-heavy and
 * written by the public site, so in Supabase mode each gets a real
 * relational table (see supabase/schema.sql). In local mode they live in
 * /data JSON files with the same shapes.
 */

export type AppStatus = "New" | "Reviewing" | "Accepted" | "Rejected" | "Waitlisted";
export const APP_STATUSES: AppStatus[] = ["New", "Reviewing", "Accepted", "Rejected", "Waitlisted"];

export type Application = {
  id: string;
  student: string;
  grade: string;
  dob: string;
  previous_school: string;
  parent: string;
  phone: string;
  email: string;
  address: string;
  documents: string[];
  status: AppStatus;
  notes: string;
  /** Staff member handling this application ("" = unassigned). */
  assigned_to: string;
  created_at: string;
};

export type MsgStatus = "Unread" | "Read" | "Replied" | "Archived";
export const MSG_STATUSES: MsgStatus[] = ["Unread", "Read", "Replied", "Archived"];

export type Message = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
  status: MsgStatus;
  created_at: string;
};

export type Activity = { id: string; actor: string; action: string; type: string; created_at: string };

const FILES = { applications: "applications.json", messages: "messages.json", activity: "activity.json" } as const;
type Table = keyof typeof FILES;

/* ------------------------------ local mode ------------------------------ */

const fileFor = (t: Table) => path.join(process.cwd(), "data", FILES[t]);

let chain: Promise<unknown> = Promise.resolve();
const serialize = <T,>(task: () => Promise<T>): Promise<T> => {
  const run = chain.then(task, task);
  chain = run.catch(() => undefined);
  return run;
};

async function localAll<T>(t: Table): Promise<T[]> {
  try {
    return JSON.parse(await fs.readFile(fileFor(t), "utf8")) as T[];
  } catch {
    return [];
  }
}

const localWrite = (t: Table, rows: unknown[]) =>
  serialize(() => fs.writeFile(fileFor(t), JSON.stringify(rows, null, 2) + "\n", "utf8"));

/* -------------------------------- facade -------------------------------- */

async function list<T extends { created_at: string }>(t: Table): Promise<T[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseAdmin().from(t).select("*").order("created_at", { ascending: false });
    if (error) throw new Error(`Supabase read failed for ${t}: ${error.message}`);
    return (data ?? []) as T[];
  }
  const rows = await localAll<T>(t);
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function insert<T extends { id: string }>(t: Table, row: T): Promise<T> {
  if (isSupabaseConfigured()) {
    const { error } = await supabaseAdmin().from(t).insert(row);
    if (error) throw new Error(`Supabase insert failed for ${t}: ${error.message}`);
    return row;
  }
  await localWrite(t, [row, ...(await localAll<T>(t))]);
  return row;
}

async function patch<T extends { id: string }>(t: Table, id: string, fields: Partial<T>): Promise<T | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseAdmin().from(t).update(fields as Record<string, unknown>).eq("id", id).select().maybeSingle();
    if (error) throw new Error(`Supabase update failed for ${t}: ${error.message}`);
    return (data as T) ?? null;
  }
  const rows = await localAll<T>(t);
  const i = rows.findIndex((r) => r.id === id);
  if (i === -1) return null;
  rows[i] = { ...rows[i], ...fields };
  await localWrite(t, rows);
  return rows[i];
}

async function remove(t: Table, id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabaseAdmin().from(t).delete().eq("id", id);
    if (error) throw new Error(`Supabase delete failed for ${t}: ${error.message}`);
    return true;
  }
  const rows = await localAll<{ id: string }>(t);
  const next = rows.filter((r) => r.id !== id);
  if (next.length === rows.length) return false;
  await localWrite(t, next);
  return true;
}

export const applications = {
  list: () => list<Application>("applications"),
  insert: (a: Omit<Application, "id" | "created_at" | "status" | "notes" | "assigned_to">) =>
    insert<Application>("applications", {
      ...a, id: `APP-${new Date().getFullYear() + 57}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      status: "New", notes: "", assigned_to: "", created_at: new Date().toISOString(),
    }),
  patch: (id: string, f: Partial<Application>) => patch<Application>("applications", id, f),
  remove: (id: string) => remove("applications", id),
};

export const messages = {
  list: () => list<Message>("messages"),
  insert: (m: Omit<Message, "id" | "created_at" | "status">) =>
    insert<Message>("messages", { ...m, id: randomUUID(), status: "Unread", created_at: new Date().toISOString() }),
  patch: (id: string, f: Partial<Message>) => patch<Message>("messages", id, f),
  remove: (id: string) => remove("messages", id),
};

/** Fire-and-forget audit trail; a logging failure never breaks the action. */
export async function logActivity(actor: string, action: string, type: string) {
  try {
    await insert<Activity>("activity", {
      id: randomUUID(), actor, action, type, created_at: new Date().toISOString(),
    });
  } catch {
    /* non-fatal */
  }
}

export const activity = { list: () => list<Activity>("activity") };