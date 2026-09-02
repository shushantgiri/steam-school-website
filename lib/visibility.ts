import { todayIso } from "./format";
import type { Status } from "./types";

/**
 * The one rule that decides whether a record is on the public website:
 * published, or scheduled for a date that has arrived. Kept free of `fs`
 * so the admin dashboard can preview the same result in the browser.
 */
export function isPublicEntry(
  item: { status: Status; date: string; expires?: string },
  today = todayIso()
) {
  // An expiry date that has passed retires the notice from the active feed,
  // whatever its status says — no manual clean-up needed.
  if (item.expires && item.expires < today) return false;
  if (item.status === "Published") return true;
  if (item.status === "Scheduled") return !!item.date && item.date <= today;
  return false;
}
