export function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/** "Friday, 12 September 2026" — used for event headlines. */
export function formatLongDate(iso: string, withWeekday = false) {
  if (!iso) return "Date to be announced";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    ...(withWeekday ? { weekday: "long" as const } : {}),
    day: "numeric", month: "long", year: "numeric",
  });
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Today as yyyy-mm-dd, so ISO date strings can be compared directly. */
export function todayIso(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** yyyy-mm, the month a calendar should open on. */
export function monthKey(iso: string) {
  return iso.slice(0, 7);
}
