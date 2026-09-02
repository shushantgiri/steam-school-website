import { readJson, writeJson } from "./store";
import { img } from "./images";

/**
 * Photo slots — the heart of "manage the website location, not the file".
 *
 * Every built-in photo on the public website (the homepage Learning cards,
 * Student Experience photos, Academics programmes, Facilities, Student Life
 * activities, …) is a named SLOT with:
 *   • a plain-language label and location ("Homepage → Learning — Science")
 *   • a built-in default photo (from lib/images.ts)
 *   • an optional admin override, stored in site-images.json
 *
 * The Media Library lists these slots so an admin changes "the Science photo
 * on the homepage" — never "IMG_4829.jpg". Slots whose photos live in other
 * stores (homepage.json, about.json) are surfaced by the API layer, not here.
 */

export const SITE_IMAGES_FILE = "site-images.json";

export type SiteImageSlot = {
  id: string;
  /** Short photo name, e.g. "Science". */
  label: string;
  /** Filter group in the Media Library. */
  page: "Homepage" | "Academics" | "Facilities" | "Student Life" | "Admissions";
  /** Exact location, e.g. "Homepage → Learning — Science". */
  location: string;
  /** Public page (with #anchor where useful) for "View on Website". */
  viewHref: string;
  /** Friendly size guidance. */
  recommended: string;
  /** Built-in default photo. */
  defaultUrl: string;
};

const slot = (
  id: string, label: string, page: SiteImageSlot["page"], location: string,
  viewHref: string, defaultUrl: string, recommended = "1600 × 1200 px"
): SiteImageSlot => ({ id, label, page, location, viewHref, recommended, defaultUrl });

export const SITE_IMAGE_SLOTS: SiteImageSlot[] = [
  // Homepage → Learning beyond the classroom (six photo cards)
  slot("home-learning-science", "Science", "Homepage", "Homepage → Learning — Science", "/", img.science),
  slot("home-learning-technology", "Technology", "Homepage", "Homepage → Learning — Technology", "/", img.technology),
  slot("home-learning-engineering", "Engineering", "Homepage", "Homepage → Learning — Engineering", "/", img.engineering),
  slot("home-learning-arts", "Arts", "Homepage", "Homepage → Learning — Arts", "/", img.arts),
  slot("home-learning-math", "Mathematics", "Homepage", "Homepage → Learning — Mathematics", "/", img.math),
  slot("home-learning-sports", "Sports", "Homepage", "Homepage → Learning — Sports", "/", img.sports),
  // Homepage → Student Experience (large photo + small corner photo)
  slot("home-student-main", "Student Experience — large photo", "Homepage", "Homepage → Student Experience — large photo", "/", img.studentsOutdoor),
  slot("home-student-small", "Student Experience — small photo", "Homepage", "Homepage → Student Experience — small corner photo", "/", img.artRoom, "800 × 800 px"),

  // Academics page programmes
  slot("academics-steam", "STEAM Learning", "Academics", "Academics → STEAM Learning (main programme)", "/academics", img.steamLab),
  slot("academics-early", "Early Education", "Academics", "Academics → Early Education", "/academics", img.earlyEd),
  slot("academics-primary", "Primary Education", "Academics", "Academics → Primary Education", "/academics", img.primary),
  slot("academics-secondary", "Secondary Education", "Academics", "Academics → Secondary Education", "/academics", img.secondary),
  slot("academics-computer", "Computer & Technology", "Academics", "Academics → Computer & Technology", "/academics", img.computerLab),
  slot("academics-arts", "Creative Arts", "Academics", "Academics → Creative Arts", "/academics", img.artRoom),
  slot("academics-sports", "Sports & PE", "Academics", "Academics → Sports & Physical Education", "/academics", img.sports),

  // Facilities page
  slot("facility-steam-lab", "STEAM Lab", "Facilities", "Facilities → STEAM Lab (main photo)", "/facilities", img.steamLab),
  slot("facility-science-lab", "Science Laboratory", "Facilities", "Facilities → Science Laboratory", "/facilities", img.lab),
  slot("facility-computer-lab", "Computer Lab", "Facilities", "Facilities → Computer Lab", "/facilities", img.computerLab),
  slot("facility-library", "Library", "Facilities", "Facilities → Library", "/facilities", img.library),
  slot("facility-classrooms", "Modern Classrooms", "Facilities", "Facilities → Modern Classrooms", "/facilities", img.classroom),
  slot("facility-playground", "Playground", "Facilities", "Facilities → Playground", "/facilities", img.playground),
  slot("facility-sports", "Sports Facilities", "Facilities", "Facilities → Sports Facilities", "/facilities", img.sports),
  slot("facility-art-space", "Creative / Art Space", "Facilities", "Facilities → Creative / Art Space", "/facilities", img.artRoom),
  slot("facility-transport", "Transportation", "Facilities", "Facilities → Transportation", "/facilities", img.campus),
  slot("facility-cafeteria", "Cafeteria", "Facilities", "Facilities → Cafeteria", "/facilities", img.celebration),

  // Student Life page
  slot("life-science", "Science Projects", "Student Life", "Student Life → Science Projects", "/student-life", img.science),
  slot("life-sports", "Sports", "Student Life", "Student Life → Sports", "/student-life", img.sports),
  slot("life-music", "Music", "Student Life", "Student Life → Music", "/student-life", img.music),
  slot("life-technology", "Technology Projects", "Student Life", "Student Life → Technology Projects", "/student-life", img.technology),
  slot("life-tours", "Educational Tours", "Student Life", "Student Life → Educational Tours", "/student-life", img.tour),
  slot("life-arts", "Arts & Clubs", "Student Life", "Student Life → Arts & Clubs", "/student-life", img.arts),
  slot("life-competitions", "Competitions", "Student Life", "Student Life → Competitions", "/student-life", img.math),
  slot("life-celebrations", "Celebrations", "Student Life", "Student Life → Celebrations", "/student-life", img.celebration),

  // Admissions page
  slot("admissions-photo", "Admissions photo", "Admissions", "Admissions → Welcome photo", "/admissions", img.earlyEd),
];

const BY_ID = new Map(SITE_IMAGE_SLOTS.map((s) => [s.id, s]));
export const siteImageSlot = (id: string) => BY_ID.get(id);

/** Only the overrides the admin has actually set: slot id → uploaded URL. */
export async function getSiteImageOverrides(): Promise<Record<string, string>> {
  try {
    const raw = await readJson<unknown>(SITE_IMAGES_FILE);
    if (!raw || typeof raw !== "object") return {};
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (BY_ID.has(k) && typeof v === "string" && v.trim()) clean[k] = v.trim();
    }
    return clean;
  } catch {
    return {}; // nothing saved yet — every slot shows its default
  }
}

/** Set a slot's photo ("" clears it back to the built-in default). */
export async function saveSiteImage(id: string, url: string): Promise<Record<string, string>> {
  if (!BY_ID.has(id)) throw new Error("Unknown photo slot.");
  const current = await getSiteImageOverrides();
  const next = { ...current };
  if (url.trim()) next[id] = url.trim();
  else delete next[id];
  await writeJson(SITE_IMAGES_FILE, next);
  return next;
}

/** Effective photo for a slot: the admin's photo, else the built-in default. */
export function resolveSiteImage(overrides: Record<string, string>, id: string, fallback?: string): string {
  return overrides[id] ?? fallback ?? BY_ID.get(id)?.defaultUrl ?? "";
}
