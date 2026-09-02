import { readJson, writeJson } from "./store";

/**
 * Homepage content. THE RULE HERE: the page must render even when the stored
 * record is missing, partial, or from an older version of the CMS. Every read
 * goes through `mergeHomepage(DEFAULTS, stored)` — database values override a
 * default only where they actually exist and have the right type, so a new
 * field added in code never crashes a homepage saved before that field
 * existed.
 */

export type HomepageStat = { id: string; value: string; label: string; enabled: boolean };

export type HomepageContent = {
  hero: {
    eyebrow: string; headingTop: string; headingBottom: string; markWord: string;
    description: string;
    primaryLabel: string; primaryHref: string;
    secondaryLabel: string; secondaryHref: string;
    image: string;
  };
  about: {
    eyebrow: string; headingTop: string; headingBottom: string; markWord: string;
    description: string;
    primaryLabel: string; primaryHref: string;
    image: string;
  };
  academics: { eyebrow: string; heading: string; markWord: string; primaryLabel: string; primaryHref: string };
  facilities: { eyebrow: string; heading: string; markWord: string; primaryLabel: string; primaryHref: string };
  studentLife: { eyebrow: string; heading: string; markWord: string; primaryLabel: string; primaryHref: string };
  stats: {
    eyebrow: string; heading: string; markWord: string;
    items: HomepageStat[];
  };
  /** A short school video (YouTube, Vimeo or a direct .mp4 link). Hidden until a link is set. */
  video: { eyebrow: string; heading: string; description: string; url: string; image: string };
  cta: {
    eyebrow: string; heading: string; markWord: string; description: string;
    primaryLabel: string; primaryHref: string;
    secondaryLabel: string; secondaryHref: string;
  };
};

export const HOMEPAGE_FILE = "homepage.json";

export const HOMEPAGE_DEFAULTS: HomepageContent = {
  hero: {
    eyebrow: "Learn • Explore • Create • Grow",
    headingTop: "Inspiring Minds.",
    headingBottom: "Building Futures.",
    markWord: "Futures.",
    description: "A nurturing environment where students discover their potential through meaningful learning and STEAM education.",
    primaryLabel: "Apply Now", primaryHref: "/admissions/apply",
    secondaryLabel: "Explore Our School", secondaryHref: "/about",
    image: "",
  },
  about: {
    eyebrow: "About the School",
    headingTop: "Learning with",
    headingBottom: "Purpose.",
    markWord: "Purpose.",
    description:
      "Learning here is student-focused and hands-on: science, technology, engineering, arts and mathematics taught as one connected way of thinking. Every project builds creativity and the confidence to share it.",
    primaryLabel: "Discover Our School", primaryHref: "/about",
    image: "",
  },
  academics: { eyebrow: "Academics", heading: "Programs built for every stage", markWord: "every", primaryLabel: "All Programs", primaryHref: "/academics" },
  facilities: { eyebrow: "Facilities", heading: "Spaces made for making", markWord: "making", primaryLabel: "Explore Our Facilities", primaryHref: "/facilities" },
  studentLife: { eyebrow: "Student Life", heading: "More than classes", markWord: "classes", primaryLabel: "See Student Life", primaryHref: "/student-life" },
  stats: {
    eyebrow: "Our School in Numbers",
    heading: "Growing every single year",
    markWord: "Growing",
    items: [
      { id: "s1", value: "500+", label: "Students", enabled: true },
      { id: "s2", value: "5+", label: "Well-Equipped Labs", enabled: true },
      { id: "s3", value: "20+", label: "Smart Board Classrooms", enabled: true },
      { id: "s4", value: "10+", label: "Study Materials", enabled: true },
      { id: "s5", value: "10+", label: "Student Clubs", enabled: true },
      { id: "s6", value: "6+", label: "Sports Activities", enabled: true },
    ],
  },
  video: {
    eyebrow: "See Us in Action",
    heading: "A glimpse of life at our school",
    description: "Two minutes inside our classrooms, laboratories and playground.",
    url: "",
    image: "",
  },
  cta: {
    eyebrow: "Admissions Open · 2083",
    heading: "Start Your Journey",
    markWord: "Journey",
    description: "Applications for Nursery to Grade 10 take about ten minutes. We reply within three working days.",
    primaryLabel: "Start Your Application", primaryHref: "/admissions/apply",
    secondaryLabel: "Talk to Us First", secondaryHref: "/contact",
  },
};

/** True for the string keys where an empty value is meaningful. */
const emptyAllowed = (key: string) => key === "image" || key === "markWord";

function cleanStats(raw: unknown, fallback: HomepageStat[]): HomepageStat[] {
  if (!Array.isArray(raw)) return fallback;
  const items: HomepageStat[] = [];
  for (const item of raw.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const value = typeof r.value === "string" ? r.value.trim().slice(0, 12) : "";
    const label = typeof r.label === "string" ? r.label.trim().slice(0, 60) : "";
    if (!value || !label) continue;
    items.push({
      id: typeof r.id === "string" && r.id ? r.id.slice(0, 40) : crypto.randomUUID(),
      value, label,
      enabled: r.enabled !== false,
    });
  }
  return items.length > 0 ? items : fallback;
}

/**
 * defaults + stored record → safe homepage object. Also understands the
 * previous stats shape (v1/l1 … v4/l4) so older saved content upgrades
 * itself on first read instead of losing the numbers.
 */
export function mergeHomepage(defaults: HomepageContent, incoming: unknown): HomepageContent {
  const next = JSON.parse(JSON.stringify(defaults)) as HomepageContent;
  if (!incoming || typeof incoming !== "object") return next;
  const src = incoming as Record<string, unknown>;

  for (const section of Object.keys(next) as Array<keyof HomepageContent>) {
    const from = src[section];
    if (!from || typeof from !== "object") continue;
    const fromRec = from as Record<string, unknown>;
    const target = next[section] as unknown as Record<string, unknown>;
    for (const key of Object.keys(target)) {
      if (key === "items") continue; // handled below
      const v = fromRec[key];
      if (typeof v !== "string") continue;
      if (emptyAllowed(key) || v.trim()) target[key] = v.trim();
    }
  }

  // Stats list — new shape first, then the legacy v1..l4 fields.
  const statsFrom = (src.stats ?? {}) as Record<string, unknown>;
  if (Array.isArray(statsFrom.items)) {
    next.stats.items = cleanStats(statsFrom.items, defaults.stats.items);
  } else {
    const legacy: HomepageStat[] = [];
    for (let i = 1; i <= 4; i++) {
      const value = statsFrom[`v${i}`];
      const label = statsFrom[`l${i}`];
      if (typeof value === "string" && value.trim() && typeof label === "string" && label.trim()) {
        legacy.push({ id: `s${i}`, value: value.trim(), label: label.trim(), enabled: true });
      }
    }
    if (legacy.length > 0) next.stats.items = legacy;
  }
  return next;
}

/** Read for rendering and the editor — never throws, never partial. */
export async function getHomepage(): Promise<HomepageContent> {
  let stored: unknown = null;
  try {
    stored = await readJson<unknown>(HOMEPAGE_FILE);
  } catch {
    stored = null; // no record yet — the defaults render
  }
  return mergeHomepage(HOMEPAGE_DEFAULTS, stored);
}

/** Save an edit: merged over the defaults so only whole, valid content lands. */
export async function saveHomepage(incoming: unknown): Promise<HomepageContent> {
  const clean = mergeHomepage(HOMEPAGE_DEFAULTS, incoming);
  await writeJson(HOMEPAGE_FILE, clean);
  return clean;
}

/** Splits "Start Your Journey" so the chosen word can carry the underline. */
export function withMark(text: string, markWord: string): Array<{ text: string; mark: boolean }> {
  if (!markWord || !text.includes(markWord)) return [{ text, mark: false }];
  const [before, ...rest] = text.split(markWord);
  return [
    { text: before, mark: false },
    { text: markWord, mark: true },
    { text: rest.join(markWord), mark: false },
  ].filter((p) => p.text !== "");
}
