/**
 * Shapes of the records stored in /data and served by the /api routes.
 * Dependency-free on purpose — safe to import from client and server alike.
 */

export type Status = "Draft" | "Scheduled" | "Published" | "Expired" | "Archived";
export const STATUSES: Status[] = ["Draft", "Scheduled", "Published", "Expired", "Archived"];

export type Priority = "High" | "Normal" | "Low";
export const PRIORITIES: Priority[] = ["High", "Normal", "Low"];

/** Calendar categories double as event types — one record feeds both pages. */
export type CalCategory = "Exam" | "Holiday" | "Event" | "Program" | "Meeting" | "Important";
export const CAL_CATEGORIES: CalCategory[] = ["Event", "Program", "Meeting", "Exam", "Holiday", "Important"];

/** Categories that belong on the Events page; the rest are calendar-only. */
export const EVENT_PAGE_CATEGORIES: CalCategory[] = ["Event", "Program", "Meeting"];

export type NewsItem = {
  id: string;
  slug: string;
  title: string;
  /** Editorial category — Achievements, Campus, People, Academics… */
  category: string;
  author: string;
  /** ISO yyyy-mm-dd, or "" while a piece is still a draft. */
  date: string;
  status: Status;
  excerpt: string;
  body: string[];
  image?: string;
  attachment?: string;
  /** Show as a popup announcement when visitors open the website. */
  popup?: boolean;
};

export type NoticeItem = {
  id: string;
  slug: string;
  title: string;
  /** Admission, Exam, Holiday, Transport, General… */
  category: string;
  priority: Priority;
  date: string;
  /** ISO yyyy-mm-dd; after this date the notice leaves the active feed automatically. */
  expires?: string;
  status: Status;
  excerpt: string;
  body: string[];
  attachment?: string;
  /** Show as a popup announcement when visitors open the website. */
  popup?: boolean;
};

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  category: CalCategory;
  date: string;
  time?: string;
  location?: string;
  description: string;
  image?: string;
  status: Status;
  featured?: boolean;
  /** Show as a popup announcement when visitors open the website. */
  popup?: boolean;
};

export type SiteSettings = {
  name: string;
  shortName: string;
  location: string;
  region: string;
  phone: string;
  email: string;
  hours: string;
  address: string;
  tagline: string;
  social: { facebook: string; instagram: string; youtube: string };
  mapEmbed: string;
  seo: {
    title: string;
    description: string;
    keywords: string;        // comma-separated, optional
    shareTitle: string;      // Open Graph title (blank → website title)
    shareDescription: string; // Open Graph description (blank → meta description)
    shareImage: string;      // website sharing image URL (blank → built-in image)
    faviconUrl: string;      // custom favicon (blank → built-in icon)
  };
  /** Friendly wording for error pages, editable by the admin. */
  errorPages: {
    notFoundTitle: string; notFoundText: string;
    forbiddenTitle: string; forbiddenText: string;
    serverTitle: string; serverText: string;
  };
  /** Website maintenance mode: public pages show a holding page; admins keep access. */
  maintenance: { enabled: boolean; title: string; message: string; showContact: boolean };
  /** Marksheet layout and signatures — managed in Settings → Marksheets. */
  marksheet: {
    showLogo: boolean;
    headerNote: string;          // one line under the school name (e.g. affiliation); blank → motto
    footerNote: string;          // small line at the foot of the sheet
    signatures: "both" | "principal" | "none";
    principalSignature: string;  // image URL
    classTeacherName: string;
    classTeacherSignature: string; // image URL
  };
  /** Marksheet branding — all optional; blanks fall back to sensible defaults. */
  logoUrl: string;          // school logo image (upload in Media, paste the link)
  principalName: string;    // printed under the Principal's signature line
  establishedYear: string;  // e.g. "2065 BS" — shown in the marksheet header
  registrationNo: string;   // school registration / affiliation number
  motto: string;            // one line under the school name on the marksheet
};

/* ------------------------------------------------------------------ */
/* Public projections — the shapes site components already render.     */
/* News, notices and events are folded into one feed for /news.        */
/* ------------------------------------------------------------------ */

export type PostCategory = "Notice" | "News" | "Event" | "Exam" | "Holiday";
export type Post = {
  slug: string;
  title: string;
  category: PostCategory;
  date: string;
  excerpt: string;
  body: string[];
  image?: string;
  attachment?: string;
  /** High-priority notice — shown in the Important banner and filter. */
  important?: boolean;
  /** Chosen in the CMS to appear as the site-wide popup announcement. */
  popup?: boolean;
};

export type CalEvent = {
  id: string;
  date: string;
  title: string;
  category: CalCategory;
  time?: string;
  location?: string;
};
