import NepaliDate from "nepali-date-converter";

/**
 * Bikram Sambat (BS) calendar helpers, safe in both the browser and on the
 * server. All BS dates travel as "YYYY-MM-DD" strings (e.g. "2068-04-15").
 * Conversion data comes from `nepali-date-converter`, which covers BS
 * 2000-01-01 through 2090-12-30 — comfortably every student birthday.
 */

export const BS_MIN_YEAR = 2000;
export const BS_MAX_YEAR = 2090;

export const BS_MONTHS = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
] as const;

export type BsParts = { year: number; month: number; day: number }; // month/day are 1-based

const BS_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseBs(value: string): BsParts | null {
  const m = BS_RE.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < BS_MIN_YEAR || year > BS_MAX_YEAR) return null;
  if (month < 1 || month > 12 || day < 1 || day > 32) return null;
  return { year, month, day };
}

export const formatBs = ({ year, month, day }: BsParts): string =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/**
 * The converter silently rolls invalid days into the next month
 * (2068-04-33 → 2068-05-01), so validity is "the date survives a roundtrip".
 */
export function isValidBs(value: string): boolean {
  const p = parseBs(value);
  if (!p) return false;
  try {
    const d = new NepaliDate(p.year, p.month - 1, p.day);
    return d.format("YYYY-MM-DD") === formatBs(p);
  } catch {
    return false;
  }
}

const daysCache = new Map<string, number>();

/** Days in a BS month (29–32, varies per year). */
export function bsDaysInMonth(year: number, month: number): number {
  const key = `${year}-${month}`;
  const cached = daysCache.get(key);
  if (cached) return cached;
  let days = 29;
  for (let d = 30; d <= 32; d++) {
    if (isValidBs(formatBs({ year, month, day: d }))) days = d;
    else break;
  }
  daysCache.set(key, days);
  return days;
}

/** BS "2068-04-15" → AD "2011-07-31" (ISO), or null when out of range. */
export function bsToAd(value: string): string | null {
  const p = parseBs(value);
  if (!p || !isValidBs(value)) return null;
  try {
    const js = new NepaliDate(p.year, p.month - 1, p.day).toJsDate();
    const y = js.getFullYear();
    const m = String(js.getMonth() + 1).padStart(2, "0");
    const d = String(js.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return null;
  }
}

/** Today's date in BS — the picker opens on it. */
export function todayBs(): BsParts {
  try {
    const d = NepaliDate.fromAD(new Date());
    return { year: d.getYear(), month: d.getMonth() + 1, day: d.getDate() };
  } catch {
    return { year: 2082, month: 1, day: 1 };
  }
}

/** "2068-04-15" → "15 Shrawan 2068" for friendly display. */
export function bsDisplay(value: string): string {
  const p = parseBs(value);
  if (!p) return value;
  return `${p.day} ${BS_MONTHS[p.month - 1]} ${p.year}`;
}
