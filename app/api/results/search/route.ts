import { NextResponse } from "next/server";
import { findPublicResult } from "@/lib/results";
import { isValidBs } from "@/lib/bs-calendar";
import { marksheetToken } from "@/lib/marksheet-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The public result lookup. Deliberately narrow:
 *   - requires exact full name + date of birth + class
 *   - returns at most ONE published record with minimal fields
 *   - rate limited per address so the student database can't be harvested
 * Note: the limiter is per server instance (fine for one school's traffic);
 * a shared store (e.g. Upstash) is the upgrade path if abuse ever appears.
 */
const WINDOW_MS = 5 * 60 * 1000;
const MAX_TRIES = 20;
const hits = new Map<string, { count: number; reset: number }>();

function limited(key: string): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  h.count++;
  if (hits.size > 5000) {
    hits.forEach((v, k) => { if (v.reset < now) hits.delete(k); });
  }
  return h.count > MAX_TRIES;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (limited(ip)) {
    return NextResponse.json(
      { error: "Too many searches — please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

  const name = typeof b.name === "string" ? b.name.trim().slice(0, 80) : "";
  const dob = typeof b.dob === "string" ? b.dob : "";
  const klass = typeof b.class === "string" ? b.class.trim().slice(0, 20) : "";
  const year = typeof b.year === "string" && /^\d{4}$/.test(b.year.trim()) ? b.year.trim() : undefined;

  if (name.length < 3) return NextResponse.json({ error: "Enter the student's full name." }, { status: 400 });
  if (!isValidBs(dob)) return NextResponse.json({ error: "Enter the date of birth in Bikram Sambat (e.g. 2068-04-15)." }, { status: 400 });
  if (!klass) return NextResponse.json({ error: "Select the class." }, { status: 400 });

  try {
    const result = await findPublicResult({ name, dobBs: dob, klass, year });
    if (!result) {
      return NextResponse.json(
        { error: "No published result matches these details. Check the spelling of the name, the date of birth and the class." },
        { status: 404 }
      );
    }
    // The marksheet link is signed for this one result only.
    const token = result.has_marksheet ? await marksheetToken(result.id) : null;
    const { id, ...safe } = result;
    return NextResponse.json({
      ...safe,
      marksheet: token ? { view: `/results/marksheet/${id}?t=${token}`, pdf: `/api/marksheet/${id}?t=${token}&format=pdf` } : null,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
