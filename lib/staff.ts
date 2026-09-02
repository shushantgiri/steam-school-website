import { readJson, updateJson } from "./store";

/**
 * Teachers and staff, managed in the CMS (Admin → Teachers & Staff) and
 * shown on the homepage and the About page. Photos are uploaded in Media.
 */
export * from "./staff-shared";
import { STAFF_CATEGORIES, type StaffCategory, type StaffMember } from "./staff-shared";

export const STAFF_FILE = "staff.json";

const withDefaults = (m: Partial<StaffMember>): StaffMember => ({
  id: m.id ?? "",
  name: m.name ?? "",
  designation: m.designation ?? "",
  category: STAFF_CATEGORIES.includes(m.category as StaffCategory) ? (m.category as StaffCategory) : "Teacher",
  subjects: m.subjects ?? "",
  photo: m.photo ?? "",
  bio: m.bio ?? "",
  qualification: m.qualification ?? "",
  featured: m.featured ?? true,
  order: typeof m.order === "number" ? m.order : 0,
  status: m.status === "Draft" ? "Draft" : "Published",
});

export const getStaff = async () => {
  const rows = await readJson<StaffMember[]>(STAFF_FILE).catch(() => [] as StaffMember[]);
  return (Array.isArray(rows) ? rows : []).map(withDefaults).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
};
export const updateStaff = (mutate: (t: StaffMember[]) => StaffMember[]) =>
  updateJson<StaffMember[]>(STAFF_FILE, (rows) => mutate((Array.isArray(rows) ? rows : []).map(withDefaults)));

export async function getPublishedStaff(): Promise<StaffMember[]> {
  return (await getStaff()).filter((m) => m.status === "Published");
}
