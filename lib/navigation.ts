import { readJson, writeJson } from "./store";

/**
 * The public website's navigation, editable from Admin → Navigation without
 * touching source code. A top-level item is either a plain link (href, no
 * children) or a dropdown (children, href ignored). Disabled items are kept
 * in the CMS but never rendered on the site. Stored via the store facade —
 * JSON file locally, `cms_documents` row in Supabase mode — and always merged
 * over the defaults below so a missing or broken record can't blank the menu.
 */

export type NavLink = { id: string; label: string; href: string; enabled: boolean };
export type NavEntry = NavLink & { short?: string; children: NavLink[] };
export type Navigation = { items: NavEntry[] };

export const NAVIGATION_FILE = "navigation.json";

let seq = 0;
const nid = () => `n${++seq}`;

export const NAVIGATION_DEFAULTS: Navigation = {
  items: [
    { id: nid(), label: "Home", href: "/", enabled: true, children: [] },
    {
      id: nid(), label: "About", href: "/about", enabled: true, children: [
        { id: nid(), label: "Our School", href: "/about", enabled: true },
        { id: nid(), label: "Teachers & Staff", href: "/teachers", enabled: true },
        { id: nid(), label: "Student Life", href: "/student-life", enabled: true },
        { id: nid(), label: "Gallery", href: "/gallery", enabled: true },
      ],
    },
    {
      id: nid(), label: "Academics", href: "/academics", enabled: true, children: [
        { id: nid(), label: "Programs", href: "/academics", enabled: true },
        { id: nid(), label: "Academic Calendar", href: "/calendar", enabled: true },
      ],
    },
    {
      id: nid(), label: "Admissions", href: "/admissions", enabled: true, children: [
        { id: nid(), label: "Admission Process", href: "/admissions", enabled: true },
        { id: nid(), label: "Apply Now", href: "/admissions/apply", enabled: true },
      ],
    },
    {
      id: nid(), label: "News & Updates", short: "News", href: "/news", enabled: true, children: [
        { id: nid(), label: "News", href: "/news", enabled: true },
        { id: nid(), label: "Notices", href: "/news#notices", enabled: true },
        { id: nid(), label: "Events", href: "/events", enabled: true },
      ],
    },
    { id: nid(), label: "Results", href: "/results", enabled: true, children: [] },
    { id: nid(), label: "Contact", href: "/contact", enabled: true, children: [] },
  ],
};

const cleanHref = (v: unknown): string => {
  const s = typeof v === "string" ? v.trim().slice(0, 200) : "";
  // Internal paths or full http(s) links only — nothing executable.
  if (s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://") || s.startsWith("#")) return s;
  return "";
};

function cleanLink(raw: unknown): NavLink | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const label = typeof r.label === "string" ? r.label.trim().slice(0, 40) : "";
  if (!label) return null;
  return {
    id: typeof r.id === "string" && r.id ? r.id.slice(0, 40) : crypto.randomUUID(),
    label,
    href: cleanHref(r.href) || "/",
    enabled: r.enabled !== false,
  };
}

/** Rebuild the structure field by field; anything malformed is dropped. */
export function normalizeNavigation(raw: unknown): Navigation {
  if (!raw || typeof raw !== "object") return structuredClone(NAVIGATION_DEFAULTS);
  const src = raw as Record<string, unknown>;
  if (!Array.isArray(src.items)) return structuredClone(NAVIGATION_DEFAULTS);
  const items: NavEntry[] = [];
  for (const item of src.items.slice(0, 12)) {
    const base = cleanLink(item);
    if (!base) continue;
    const r = item as Record<string, unknown>;
    const children = Array.isArray(r.children)
      ? (r.children.slice(0, 10).map(cleanLink).filter(Boolean) as NavLink[])
      : [];
    const short = typeof r.short === "string" && r.short.trim() ? r.short.trim().slice(0, 20) : undefined;
    items.push({ ...base, short, children });
  }
  return items.length > 0 ? { items } : structuredClone(NAVIGATION_DEFAULTS);
}

export async function getNavigation(): Promise<Navigation> {
  try {
    return normalizeNavigation(await readJson<unknown>(NAVIGATION_FILE));
  } catch {
    return structuredClone(NAVIGATION_DEFAULTS);
  }
}

export async function saveNavigation(raw: unknown): Promise<Navigation> {
  const clean = normalizeNavigation(raw);
  await writeJson(NAVIGATION_FILE, clean);
  return clean;
}

/** Only what the public site renders: enabled items, enabled children. */
export function publicNavigation(nav: Navigation): NavEntry[] {
  const items = nav.items
    .filter((i) => i.enabled)
    .map((i) => ({ ...i, children: i.children.filter((c) => c.enabled) }));

  // Teachers & Staff lives inside the About dropdown. If a saved menu has it
  // as a top-level item, move it under About; if it is missing, add it there.
  const isTeachers = (href: string) => href.split(/[?#]/)[0] === "/teachers";
  const about = items.find((i) => i.href.split(/[?#]/)[0] === "/about");
  if (!about) return items;
  const top = items.filter((i) => isTeachers(i.href));
  const rest = items.filter((i) => !isTeachers(i.href));
  if (!about.children.some((c) => isTeachers(c.href))) {
    const link: NavLink = top[0]
      ? { id: top[0].id, label: top[0].label, href: top[0].href, enabled: true }
      : { id: "nav-teachers", label: "Teachers & Staff", href: "/teachers", enabled: true };
    const at = about.children.findIndex((c) => c.href.split(/[?#]/)[0] === "/about");
    about.children.splice(at === -1 ? 0 : at + 1, 0, link);
  }
  return rest;
}
