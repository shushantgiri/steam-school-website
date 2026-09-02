import { readJson, writeJson } from "./store";

/**
 * The About page, as one CMS document (Admin → About). Every field has a
 * sensible default so the page reads well before the school edits it, and
 * merging is defensive so a half-saved document never breaks the page.
 */
export type AboutContent = {
  intro: { eyebrow: string; heading: string; markWord: string; paragraphs: string[]; image: string; imageCaption: string };
  vision: string;
  mission: string;
  philosophy: { heading: string; paragraphs: string[]; image: string };
  values: Array<{ title: string; text: string }>;
  principal: { name: string; designation: string; photo: string; message: string[] };
  history: { heading: string; paragraphs: string[]; milestones: Array<{ year: string; text: string }> };
  different: Array<{ title: string; text: string }>;
};

export const ABOUT_FILE = "about.json";

export const ABOUT_DEFAULTS: AboutContent = {
  intro: {
    eyebrow: "About the School",
    heading: "A school built around how children really learn",
    markWord: "really",
    paragraphs: [
      "The School of STEAM Education is a private, co-educational school in Deukhuri, Dang, teaching from Nursery to Grade 10. We follow the national curriculum and add to it a hands-on approach in which science, technology, engineering, arts and mathematics are taught as one connected way of thinking.",
      "Classes are small enough for every teacher to know every child. Learning is active: students build, test, present and reflect — in the classroom, in the laboratory and outdoors.",
    ],
    image: "",
    imageCaption: "Our students in the science laboratory",
  },
  vision: "To be a school where every child in the Deukhuri valley grows into a confident, curious and capable person, ready for a changing world.",
  mission: "To provide a caring, disciplined and inspiring environment in which students master the national curriculum, learn to think and create through STEAM, and grow in character, health and community spirit.",
  philosophy: {
    heading: "Learning by doing, guided by caring teachers",
    paragraphs: [
      "We believe children learn best when they make, test and share things that matter to them. Every unit ends with something real — a model, an experiment, a performance, a solution.",
      "Discipline and kindness go together. Clear routines, respectful classrooms and close contact with parents give students the security to take intellectual risks.",
    ],
    image: "",
  },
  values: [
    { title: "Curiosity", text: "We reward good questions as much as right answers." },
    { title: "Respect", text: "For teachers, classmates, the community and the environment." },
    { title: "Integrity", text: "Honest work, honest results, honest conversations with families." },
    { title: "Excellence", text: "High expectations for every child, with the support to reach them." },
  ],
  principal: {
    name: "",
    designation: "Principal",
    photo: "",
    message: [
      "Welcome to The School of STEAM Education. Every morning our gates open to children who arrive full of questions, and our job is to make sure they leave with even better ones.",
      "We combine the discipline of a strong national-curriculum school with the creativity of STEAM learning. Our teachers know each student personally, and we work closely with families so that no child is left behind.",
      "I invite you to visit us, meet our teachers and see our classrooms for yourself.",
    ],
  },
  history: {
    heading: "Our story",
    paragraphs: [
      "The school was founded in Deukhuri, Dang with one conviction: children in the Lumbini heartland deserve the same forward-thinking education as children anywhere in the world. It began with a handful of classrooms and a small, determined team of teachers.",
      "Year by year the school has grown — new laboratories, a library, playing fields, and now classes up to Grade 10 — while keeping the close, family-like atmosphere that families value.",
    ],
    milestones: [
      { year: "Founded", text: "The school opens its doors to its first Nursery and primary classes." },
      { year: "Growth", text: "Science and computer laboratories added; STEAM project learning introduced." },
      { year: "Today", text: "Nursery to Grade 10, with a full team of trained teachers and an active parent community." },
    ],
  },
  different: [
    { title: "STEAM in every subject", text: "Projects connect science, technology, engineering, arts and mathematics — not as extras, but as the way we teach." },
    { title: "Teachers who know your child", text: "Small classes and regular parent meetings mean every student is seen and supported." },
    { title: "Real results, openly shared", text: "Examination results and marksheets are published online for families to check securely." },
    { title: "A safe, disciplined, happy place", text: "Clear routines, caring staff and a culture of respect." },
  ],
};

const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);
const arr = (v: unknown, d: string[]) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : d);
const pairs = <T extends Record<string, string>>(v: unknown, d: T[], keys: (keyof T)[]): T[] =>
  Array.isArray(v)
    ? v.filter((x) => x && typeof x === "object").map((x) => Object.fromEntries(keys.map((k) => [k, str((x as Record<string, unknown>)[k as string], "")])) as T).slice(0, 8)
    : d;

/** Deep, defensive merge of stored data over the defaults. */
export function mergeAbout(input: unknown): AboutContent {
  const i = (input && typeof input === "object" ? input : {}) as Record<string, Record<string, unknown>>;
  const D = ABOUT_DEFAULTS;
  const g = (k: keyof AboutContent) => (i[k] && typeof i[k] === "object" ? i[k] : {}) as Record<string, unknown>;
  return {
    intro: {
      eyebrow: str(g("intro").eyebrow, D.intro.eyebrow), heading: str(g("intro").heading, D.intro.heading),
      markWord: str(g("intro").markWord, D.intro.markWord), paragraphs: arr(g("intro").paragraphs, D.intro.paragraphs),
      image: str(g("intro").image, ""), imageCaption: str(g("intro").imageCaption, D.intro.imageCaption),
    },
    vision: str(i.vision as unknown, D.vision),
    mission: str(i.mission as unknown, D.mission),
    philosophy: { heading: str(g("philosophy").heading, D.philosophy.heading), paragraphs: arr(g("philosophy").paragraphs, D.philosophy.paragraphs), image: str(g("philosophy").image, "") },
    values: pairs(i.values, D.values, ["title", "text"]),
    principal: { name: str(g("principal").name, ""), designation: str(g("principal").designation, D.principal.designation), photo: str(g("principal").photo, ""), message: arr(g("principal").message, D.principal.message) },
    history: { heading: str(g("history").heading, D.history.heading), paragraphs: arr(g("history").paragraphs, D.history.paragraphs), milestones: pairs(g("history").milestones, D.history.milestones, ["year", "text"]) },
    different: pairs(i.different, D.different, ["title", "text"]),
  };
}

export async function getAbout(): Promise<AboutContent> {
  try { return mergeAbout(await readJson<unknown>(ABOUT_FILE)); } catch { return ABOUT_DEFAULTS; }
}
export const saveAbout = (content: AboutContent) => writeJson(ABOUT_FILE, content);
