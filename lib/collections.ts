import {
  CAL_CATEGORIES,
  PRIORITIES,
  STATUSES,
  type CalCategory,
  type EventItem,
  type NewsItem,
  type NoticeItem,
  type Priority,
  type SiteSettings,
  type Status,
} from "./types";

/**
 * Validation and normalization for everything written through /api.
 * Records are rebuilt field by field, so unknown keys from a request body
 * never reach disk.
 */

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): Result<never> => ({ ok: false, error });

type Input = Record<string, unknown>;

export const ERROR_PAGE_DEFAULTS = {
  notFoundTitle: "Page Not Found",
  notFoundText: "Sorry, we couldn't find the page you're looking for.",
  forbiddenTitle: "Access Denied",
  forbiddenText: "Sorry, you don't have permission to view this page.",
  serverTitle: "Something Went Wrong",
  serverText: "We're having a little trouble right now. Please try again later.",
};
export const MARKSHEET_DEFAULTS = {
  showLogo: true,
  headerNote: "",
  footerNote: "Issued by the school. Valid with the authorised signatures.",
  signatures: "both" as const,
  principalSignature: "",
  classTeacherName: "",
  classTeacherSignature: "",
};
export const MAINTENANCE_DEFAULTS = {
  enabled: false,
  title: "We'll Be Back Soon",
  message: "Our website is currently being updated. Please check back again shortly.",
  showContact: true,
};

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v.trim() : fallback);
const bool = (v: unknown, fallback: boolean) =>
  typeof v === "boolean" ? v : typeof v === "string" ? v === "true" || v === "Yes" : fallback;
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
function isValidDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(value + "T00:00:00");
  return !Number.isNaN(d.getTime());
}

/** Body arrives as an array from JSON, or as textarea text with blank lines. */
function toBody(v: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(v)) return v.map((p) => String(p).trim()).filter(Boolean);
  if (typeof v === "string") {
    return v.split(/\n\s*\n/).map((p) => p.trim().replace(/\s*\n\s*/g, " ")).filter(Boolean);
  }
  return fallback;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Appends -2, -3… until the slug is free. `taken` excludes the record itself. */
export function uniqueSlug(desired: string, taken: Set<string>) {
  const base = desired || "untitled";
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

function shared(input: Input, existing: { title: string; date: string; status: Status } | undefined) {
  const title = str(input.title, existing?.title ?? "");
  if (!title) return fail("Title is required.");

  const date = "date" in input ? str(input.date) : existing?.date ?? "";
  if (date && !isValidDate(date)) return fail("Date must be a valid yyyy-mm-dd date.");

  const status = pick(input.status ?? existing?.status, STATUSES, "Draft");
  if (status === "Published" && !date) return fail("A published entry needs a date.");
  if (status === "Scheduled" && !date) return fail("A scheduled entry needs a date.");

  return { ok: true as const, value: { title, date, status } };
}

const excerptFrom = (excerpt: string, body: string[]) =>
  excerpt || (body[0] ? body[0].slice(0, 160) : "");

export function normalizeNews(input: Input, existing?: NewsItem): Result<NewsItem> {
  const base = shared(input, existing);
  if (!base.ok) return base;

  const body = toBody(input.body, existing?.body ?? []);
  return {
    ok: true,
    value: {
      id: existing?.id ?? newId("n"),
      slug: slugify(str(input.slug, existing?.slug ?? "")) || slugify(base.value.title),
      title: base.value.title,
      category: str(input.category, existing?.category ?? "") || "General",
      author: str(input.author, existing?.author ?? ""),
      date: base.value.date,
      status: base.value.status,
      excerpt: excerptFrom(str(input.excerpt, existing?.excerpt ?? ""), body),
      body,
      image: str(input.image, existing?.image ?? "") || undefined,
      attachment: str(input.attachment, existing?.attachment ?? "") || undefined,
      popup: bool(input.popup, existing?.popup ?? false),
    },
  };
}

export function normalizeNotice(input: Input, existing?: NoticeItem): Result<NoticeItem> {
  const base = shared(input, existing);
  if (!base.ok) return base;

  const body = toBody(input.body, existing?.body ?? []);
  return {
    ok: true,
    value: {
      id: existing?.id ?? newId("t"),
      slug: slugify(str(input.slug, existing?.slug ?? "")) || slugify(base.value.title),
      title: base.value.title,
      category: str(input.category, existing?.category ?? "") || "General",
      priority: pick<Priority>(input.priority ?? existing?.priority, PRIORITIES, "Normal"),
      date: base.value.date,
      expires: /^\d{4}-\d{2}-\d{2}$/.test(str(input.expires, existing?.expires ?? ""))
        ? str(input.expires, existing?.expires ?? "")
        : undefined,
      status: base.value.status,
      excerpt: excerptFrom(str(input.excerpt, existing?.excerpt ?? ""), body),
      body,
      attachment: str(input.attachment, existing?.attachment ?? "") || undefined,
      popup: bool(input.popup, existing?.popup ?? false),
    },
  };
}

export function normalizeEvent(input: Input, existing?: EventItem): Result<EventItem> {
  const base = shared(input, existing);
  if (!base.ok) return base;
  if (!base.value.date) return fail("An event needs a date.");

  return {
    ok: true,
    value: {
      id: existing?.id ?? newId("e"),
      slug: slugify(str(input.slug, existing?.slug ?? "")) || slugify(base.value.title),
      title: base.value.title,
      category: pick<CalCategory>(input.category ?? existing?.category, CAL_CATEGORIES, "Event"),
      date: base.value.date,
      time: str(input.time, existing?.time ?? ""),
      location: str(input.location, existing?.location ?? ""),
      description: str(input.description, existing?.description ?? ""),
      image: str(input.image, existing?.image ?? ""),
      status: base.value.status,
      featured:
        typeof input.featured === "boolean"
          ? input.featured
          : typeof input.featured === "string"
            ? input.featured === "Yes" || input.featured === "true"
            : existing?.featured ?? false,
      popup: bool(input.popup, existing?.popup ?? false),
    },
  };
}

export function normalizeSettings(input: Input, current: SiteSettings): Result<SiteSettings> {
  const name = str(input.name, current.name);
  if (!name) return fail("School name is required.");

  const social = (input.social ?? {}) as Input;
  const seo = (input.seo ?? {}) as Input;
  const errorPages = (input.errorPages ?? {}) as Input;
  const maintenance = (input.maintenance ?? {}) as Input;
  const marksheet = (input.marksheet ?? {}) as Input;
  const curMs = current.marksheet ?? MARKSHEET_DEFAULTS;
  const curErr = current.errorPages ?? ERROR_PAGE_DEFAULTS;
  const curMaint = current.maintenance ?? MAINTENANCE_DEFAULTS;
  return {
    ok: true,
    value: {
      name,
      shortName: str(input.shortName, current.shortName) || name,
      location: str(input.location, current.location),
      region: str(input.region, current.region),
      phone: str(input.phone, current.phone),
      email: str(input.email, current.email),
      hours: str(input.hours, current.hours),
      address: str(input.address, current.address),
      tagline: str(input.tagline, current.tagline),
      social: {
        facebook: str(social.facebook, current.social.facebook),
        instagram: str(social.instagram, current.social.instagram),
        youtube: str(social.youtube, current.social.youtube),
      },
      mapEmbed: str(input.mapEmbed, current.mapEmbed),
      seo: {
        title: str(seo.title, current.seo.title),
        description: str(seo.description, current.seo.description),
        keywords: str(seo.keywords, current.seo.keywords ?? ""),
        shareTitle: str(seo.shareTitle, current.seo.shareTitle ?? ""),
        shareDescription: str(seo.shareDescription, current.seo.shareDescription ?? ""),
        shareImage: str(seo.shareImage, current.seo.shareImage ?? ""),
        faviconUrl: str(seo.faviconUrl, current.seo.faviconUrl ?? ""),
      },
      errorPages: {
        notFoundTitle: str(errorPages.notFoundTitle, curErr.notFoundTitle) || ERROR_PAGE_DEFAULTS.notFoundTitle,
        notFoundText: str(errorPages.notFoundText, curErr.notFoundText) || ERROR_PAGE_DEFAULTS.notFoundText,
        forbiddenTitle: str(errorPages.forbiddenTitle, curErr.forbiddenTitle) || ERROR_PAGE_DEFAULTS.forbiddenTitle,
        forbiddenText: str(errorPages.forbiddenText, curErr.forbiddenText) || ERROR_PAGE_DEFAULTS.forbiddenText,
        serverTitle: str(errorPages.serverTitle, curErr.serverTitle) || ERROR_PAGE_DEFAULTS.serverTitle,
        serverText: str(errorPages.serverText, curErr.serverText) || ERROR_PAGE_DEFAULTS.serverText,
      },
      marksheet: {
        showLogo: typeof marksheet.showLogo === "boolean" ? marksheet.showLogo : curMs.showLogo,
        headerNote: str(marksheet.headerNote, curMs.headerNote),
        footerNote: str(marksheet.footerNote, curMs.footerNote),
        signatures: marksheet.signatures === "principal" || marksheet.signatures === "none" || marksheet.signatures === "both" ? marksheet.signatures : curMs.signatures,
        principalSignature: str(marksheet.principalSignature, curMs.principalSignature),
        classTeacherName: str(marksheet.classTeacherName, curMs.classTeacherName),
        classTeacherSignature: str(marksheet.classTeacherSignature, curMs.classTeacherSignature),
      },
      maintenance: {
        enabled: typeof maintenance.enabled === "boolean" ? maintenance.enabled : curMaint.enabled,
        title: str(maintenance.title, curMaint.title) || MAINTENANCE_DEFAULTS.title,
        message: str(maintenance.message, curMaint.message) || MAINTENANCE_DEFAULTS.message,
        showContact: typeof maintenance.showContact === "boolean" ? maintenance.showContact : curMaint.showContact,
      },
      logoUrl: str(input.logoUrl, current.logoUrl ?? ""),
      principalName: str(input.principalName, current.principalName ?? ""),
      establishedYear: str(input.establishedYear, current.establishedYear ?? ""),
      registrationNo: str(input.registrationNo, current.registrationNo ?? ""),
      motto: str(input.motto, current.motto ?? ""),
    },
  };
}
