import { NextResponse } from "next/server";
import { FILES, getEvents, getNews, getNotices, getSettings } from "./data";
import {
  normalizeEvent,
  normalizeNews,
  normalizeNotice,
  normalizeSettings,
  uniqueSlug,
  type Result,
} from "./collections";
import { readJson, updateJson, writeJson } from "./store";
import { logActivity } from "./records";
import type { EventItem, NewsItem, NoticeItem, SiteSettings } from "./types";

/**
 * Shared implementation behind the /api route handlers. Each route file stays
 * a thin, statically analysable wrapper around these.
 */

export type CollectionName = "news" | "notices" | "events";
export type CollectionItem = NewsItem | NoticeItem | EventItem;

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });
const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

async function parseBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function normalize(
  name: CollectionName,
  input: Record<string, unknown>,
  existing?: CollectionItem
): Result<CollectionItem> {
  switch (name) {
    case "news": return normalizeNews(input, existing as NewsItem | undefined);
    case "notices": return normalizeNotice(input, existing as NoticeItem | undefined);
    case "events": return normalizeEvent(input, existing as EventItem | undefined);
  }
}

/**
 * News, notices and events all publish under /news/<slug>, so a new slug has
 * to be unique across all three — not just within its own file.
 */
async function takenSlugs(exceptId?: string) {
  const [news, notices, events] = await Promise.all([getNews(), getNotices(), getEvents()]);
  return new Set(
    [...news, ...notices, ...events]
      .filter((item) => item.id !== exceptId)
      .map((item) => item.slug)
  );
}

const LABEL: Record<CollectionName, string> = { news: "News", notices: "Notice", events: "Event" };

export async function listCollection(name: CollectionName) {
  return NextResponse.json(await readJson<CollectionItem[]>(FILES[name]));
}

export async function getFromCollection(name: CollectionName, id: string) {
  const items = await readJson<CollectionItem[]>(FILES[name]);
  const item = items.find((i) => i.id === id);
  return item ? NextResponse.json(item) : notFound();
}

export async function createInCollection(name: CollectionName, req: Request) {
  const input = await parseBody(req);
  if (!input) return badRequest("Expected a JSON object.");

  const result = normalize(name, input);
  if (!result.ok) return badRequest(result.error);

  let created = result.value;
  await updateJson<CollectionItem[]>(FILES[name], async (items) => {
    created = { ...created, slug: uniqueSlug(created.slug, await takenSlugs()) };
    return [created, ...items];
  });
  await logActivity("Admin", `${LABEL[name]} created — ${created.title}`, LABEL[name]);
  return NextResponse.json(created, { status: 201 });
}

export async function updateInCollection(name: CollectionName, id: string, req: Request) {
  const input = await parseBody(req);
  if (!input) return badRequest("Expected a JSON object.");

  const items = await readJson<CollectionItem[]>(FILES[name]);
  const existing = items.find((i) => i.id === id);
  if (!existing) return notFound();

  const result = normalize(name, input, existing);
  if (!result.ok) return badRequest(result.error);

  let updated = result.value;
  await updateJson<CollectionItem[]>(FILES[name], async (current) => {
    updated = { ...updated, slug: uniqueSlug(updated.slug, await takenSlugs(id)) };
    return current.map((i) => (i.id === id ? updated : i));
  });
  await logActivity("Admin", `${LABEL[name]} updated — ${updated.title}${updated.status === "Published" ? " (published)" : ""}`, LABEL[name]);
  return NextResponse.json(updated);
}

export async function deleteFromCollection(name: CollectionName, id: string) {
  let found = false;
  await updateJson<CollectionItem[]>(FILES[name], (items) => {
    found = items.some((i) => i.id === id);
    return items.filter((i) => i.id !== id);
  });
  if (found) await logActivity("Admin", `${LABEL[name]} deleted`, LABEL[name]);
  return found ? NextResponse.json({ id }) : notFound();
}

export async function readSettings() {
  return NextResponse.json(await getSettings());
}

export async function saveSettings(req: Request) {
  const input = await parseBody(req);
  if (!input) return badRequest("Expected a JSON object.");

  const result = normalizeSettings(input, await getSettings());
  if (!result.ok) return badRequest(result.error);

  await writeJson(FILES.settings, result.value satisfies SiteSettings);
  await logActivity("Admin", "School settings updated", "Settings");
  return NextResponse.json(result.value);
}
