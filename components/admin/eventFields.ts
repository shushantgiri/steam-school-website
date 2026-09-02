import type { FieldDef } from "./EntryForm";
import { CAL_CATEGORIES, STATUSES, type EventItem } from "@/lib/types";

/** Shared by the Events page and the Calendar page — one event record, one editor. */
export const eventFields: FieldDef[] = [
  { name: "title", label: "Title", full: true },
  { name: "category", label: "Category", type: "select", options: CAL_CATEGORIES, help: "Exams, holidays and important dates show on the calendar only." },
  { name: "date", label: "Date", type: "date" },
  { name: "time", label: "Time", placeholder: "10:00 AM – 3:00 PM" },
  { name: "location", label: "Location", placeholder: "School grounds" },
  { name: "status", label: "Status", type: "select", options: STATUSES },
  { name: "featured", label: "Feature on the Events page", type: "select", options: ["No", "Yes"] },
  { name: "popup", label: "Show as popup on the website", type: "select", options: ["No", "Yes"], help: "When Yes, visitors see this event as a popup announcement when they open the website (until the event date)." },
  { name: "description", label: "Description", type: "textarea", rows: 4, full: true },
  {
    name: "image", label: "Event photo", type: "image", full: true,
    folder: "events", location: "Events → Event photo", recommended: "1600 × 900 px",
    help: "Shown on the Events page next to this event.",
  },
];

export const eventToForm = (r: EventItem): Record<string, string> => ({
  title: r.title,
  category: r.category,
  date: r.date,
  time: r.time ?? "",
  location: r.location ?? "",
  status: r.status,
  featured: r.featured ? "Yes" : "No",
  popup: r.popup ? "Yes" : "No",
  description: r.description,
  image: r.image ?? "",
});

export const newEventForm: Record<string, string> = { status: "Draft", category: "Event", featured: "No", popup: "No" };
