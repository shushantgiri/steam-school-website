import { readJson } from "./store";
import { todayIso } from "./format";
import { isPublicEntry as isPublic } from "./visibility";
import {
  EVENT_PAGE_CATEGORIES,
  type CalEvent,
  type EventItem,
  type NewsItem,
  type NoticeItem,
  type Post,
  type SiteSettings,
} from "./types";

/**
 * Server-side reads of the CMS content, plus the projections the public site
 * renders. Everything here reads from disk on every call — public pages are
 * dynamic, so an edit in /admin shows up on the next page load.
 */

export const FILES = {
  news: "news.json",
  notices: "notices.json",
  events: "events.json",
  settings: "settings.json",
} as const;

export const getNews = () => readJson<NewsItem[]>(FILES.news);
export const getNotices = () => readJson<NoticeItem[]>(FILES.notices);
export const getEvents = () => readJson<EventItem[]>(FILES.events);
import { ERROR_PAGE_DEFAULTS, MAINTENANCE_DEFAULTS, MARKSHEET_DEFAULTS } from "./collections";

/** Settings with every newer field defaulted, so older saved documents keep working. */
export async function getSettings(): Promise<SiteSettings> {
  const raw = (await readJson<unknown>(FILES.settings)) as Record<string, unknown>;
  const seo = (raw.seo ?? {}) as Record<string, string>;
  const pick = (k: string) => (typeof seo[k] === "string" ? seo[k] : "");
  return {
    ...(raw as unknown as SiteSettings),
    seo: {
      title: pick("title"), description: pick("description"), keywords: pick("keywords"),
      shareTitle: pick("shareTitle"), shareDescription: pick("shareDescription"),
      shareImage: pick("shareImage"), faviconUrl: pick("faviconUrl"),
    },
    errorPages: { ...ERROR_PAGE_DEFAULTS, ...((raw.errorPages as object) ?? {}) },
    maintenance: { ...MAINTENANCE_DEFAULTS, ...((raw.maintenance as object) ?? {}) },
    marksheet: { ...MARKSHEET_DEFAULTS, ...((raw.marksheet as object) ?? {}) },
    logoUrl: typeof raw.logoUrl === "string" ? raw.logoUrl : "",
    principalName: typeof raw.principalName === "string" ? raw.principalName : "",
    establishedYear: typeof raw.establishedYear === "string" ? raw.establishedYear : "",
    registrationNo: typeof raw.registrationNo === "string" ? raw.registrationNo : "",
    motto: typeof raw.motto === "string" ? raw.motto : "",
  };
}

export { isPublicEntry as isPublic } from "./visibility";

/** Newest first; undated entries sink to the bottom. */
const byDateDesc = (a: { date: string }, b: { date: string }) =>
  (b.date || "").localeCompare(a.date || "");

function newsToPost(n: NewsItem): Post {
  return {
    slug: n.slug, title: n.title, category: "News", date: n.date,
    excerpt: n.excerpt, body: n.body, image: n.image || undefined,
    attachment: n.attachment || undefined, popup: n.popup,
  };
}

function noticeToPost(n: NoticeItem): Post {
  // Exam and holiday notices keep their own badge in the public feed.
  const category = n.category === "Exam" ? "Exam" : n.category === "Holiday" ? "Holiday" : "Notice";
  return {
    slug: n.slug, title: n.title, category, date: n.date,
    excerpt: n.excerpt, body: n.body, attachment: n.attachment || undefined,
    important: n.priority === "High", popup: n.popup,
  };
}

function eventToPost(e: EventItem): Post {
  return {
    slug: e.slug, title: e.title, category: "Event", date: e.date,
    excerpt: e.description, body: [e.description], image: e.image || undefined, popup: e.popup,
  };
}

/** The /news feed: published news + notices + events, newest first. */
export async function getPublicPosts(): Promise<Post[]> {
  const today = todayIso();
  const [news, notices, events] = await Promise.all([getNews(), getNotices(), getEvents()]);
  return [
    ...news.filter((n) => isPublic(n, today)).map(newsToPost),
    ...notices.filter((n) => isPublic(n, today)).map(noticeToPost),
    // Exams and holidays already reach families as notices and on the
    // calendar — only real events join the feed.
    ...events.filter((e) => isPublic(e, today) && e.category === "Event").map(eventToPost),
  ].sort(byDateDesc);
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  return (await getPublicPosts()).find((p) => p.slug === slug);
}

export async function getCalendarEvents(): Promise<CalEvent[]> {
  const today = todayIso();
  const events = await getEvents();
  return events
    .filter((e) => isPublic(e, today) && !!e.date)
    .map(({ id, date, title, category, time, location }) => ({
      id, date, title, category,
      time: time || undefined,
      location: location || undefined,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Featured / upcoming / past split for the Events page. */
export async function getEventsPage(): Promise<{
  featured?: EventItem;
  upcoming: EventItem[];
  past: EventItem[];
}> {
  const today = todayIso();
  const events = (await getEvents()).filter(
    (e) => isPublic(e, today) && EVENT_PAGE_CATEGORIES.includes(e.category)
  );

  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter((e) => e.date < today).sort(byDateDesc);

  // An explicitly featured event wins, as long as it hasn't already happened;
  // otherwise the next thing on the calendar leads the page.
  const featured = upcoming.find((e) => e.featured) ?? upcoming[0];

  return {
    featured,
    upcoming: upcoming.filter((e) => e.id !== featured?.id),
    past: past.slice(0, 6),
  };
}

/**
 * The announcement popup: the newest published item an admin has flagged
 * "show as popup" — news, notice or event. Expired notices and past events
 * never pop up. Null when nothing is flagged.
 */
export async function getPopupPost(): Promise<Post | null> {
  const today = todayIso();
  const [news, notices, events] = await Promise.all([getNews(), getNotices(), getEvents()]);
  const candidates: Post[] = [
    ...news.filter((n) => n.popup && isPublic(n, today)).map(newsToPost),
    ...notices.filter((n) => n.popup && isPublic(n, today)).map(noticeToPost),
    ...events.filter((e) => e.popup && isPublic(e, today) && e.date >= today).map(eventToPost),
  ];
  return candidates.sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}
