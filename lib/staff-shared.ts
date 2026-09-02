/** Browser-safe staff types and constants (no file-system imports). */

export type StaffStatus = "Published" | "Draft";
export type StaffCategory = "Teacher" | "Administration" | "Support";
export const STAFF_CATEGORIES: StaffCategory[] = ["Teacher", "Administration", "Support"];
export const STAFF_CATEGORY_LABELS: Record<StaffCategory, string> = { Teacher: "Teachers", Administration: "Administration", Support: "Support Staff" };
export type StaffMember = {
  id: string;
  name: string;
  designation: string;   // "Principal", "Science Teacher", "Office Assistant"
  category: StaffCategory; // directory filter
  subjects: string;      // "Mathematics · Science" (free text, optional)
  photo: string;         // image URL (optional)
  bio: string;           // one or two sentences (optional)
  qualification: string; // "M.Ed., 12 years of teaching" (optional)
  featured: boolean;     // appears in the homepage teachers section
  order: number;         // lower comes first
  status: StaffStatus;
};

