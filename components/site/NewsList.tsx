"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Paperclip, Megaphone, CalendarDays,
  ChevronLeft, ChevronRight, X, Clock,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Post, PostCategory } from "@/lib/types";
import { formatDate, todayIso } from "@/lib/format";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Categories that count as notices for the side panel. */
const NOTICE_CATEGORIES: PostCategory[] = ["Notice", "Exam", "Holiday"];

const monthDay = (iso: string) => {
  if (!iso) return { day: "—", mon: "" };
  const d = new Date(`${iso}T00:00:00`);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    mon: d.toLocaleString("en", { month: "short" }).toUpperCase(),
  };
};

const isoOf = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** "Today" / "Tomorrow" / "In 16 days" — small words beat mental date maths. */
function daysAway(iso: string, today: string): string {
  const diff = Math.round((new Date(`${iso}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return `In ${diff} days`;
  if (diff < 14) return "Next week";
  return `In ${diff} days`;
}

const tone = (c: PostCategory) =>
  c === "Notice" ? "teal" : c === "Exam" ? "ink" : c === "Holiday" ? "sun" : "gray";

/**
 * The public information centre, kept deliberately simple:
 *   1. Important Notice banner (when a High-priority notice is live)
 *   2. A month calendar (browse any month) beside the Notices panel
 *   3. Clicking a dotted calendar day opens that day's posts in a popup
 */
export default function NewsList({ posts, important }: { posts: Post[]; important?: Post | null }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = todayIso();
  const [calYear, setCalYear] = useState(() => Number(today.slice(0, 4)));
  const [calMonth, setCalMonth] = useState(() => Number(today.slice(5, 7)) - 1); // 0-based

  /** Dates with at least one live post — powers the calendar dots. */
  const postDates = useMemo(() => new Set(posts.map((p) => p.date).filter(Boolean)), [posts]);

  /** Posts on the picked day — shown in the popup. */
  const dayPosts = useMemo(
    () => (selectedDate ? posts.filter((p) => p.date === selectedDate) : []),
    [posts, selectedDate]
  );

  /** "2026-08" for the month the calendar is showing. */
  const viewedMonth = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;

  /**
   * Notices panel follows the calendar, showing 5 whenever 5 exist:
   *   1. The viewed month first — up to 2 upcoming (soonest), then that
   *      month's past notices (newest).
   *   2. If the month has fewer than 5, the most recent notices from other
   *      months fill the remaining places.
   */
  const latestNotices = useMemo(() => {
    const all = posts.filter((p) => NOTICE_CATEGORIES.includes(p.category));
    const inMonth = all.filter((p) => p.date.startsWith(viewedMonth));
    const upcoming = inMonth
      .filter((p) => p.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    const past = inMonth
      .filter((p) => p.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
    const picked = [...upcoming.slice(0, 2), ...past.slice(0, 5 - Math.min(upcoming.length, 2))];
    for (const p of upcoming.slice(2)) {
      if (picked.length >= 5) break;
      picked.push(p);
    }
    // Top up from other months, newest first, until 5 (or nothing left).
    const filler = all
      .filter((p) => !p.date.startsWith(viewedMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
    for (const p of filler) {
      if (picked.length >= 5) break;
      picked.push(p);
    }
    return picked.slice(0, 5);
  }, [posts, today, viewedMonth]);

  // Popup niceties: Escape closes it, and the page behind stops scrolling.
  useEffect(() => {
    if (!selectedDate) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedDate(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selectedDate]);

  const monthLabel = new Date(calYear, calMonth, 1).toLocaleString("en", { month: "long", year: "numeric" });
  const moveMonth = (dir: -1 | 1) => {
    const d = new Date(calYear, calMonth + dir, 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };
  const firstWeekday = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  return (
    <div>
      {important && (
        <Link
          href={`/news/${important.slug}`}
          className="group mb-8 block rounded-xl2 border border-sun-400/60 bg-sun-100/50 p-5 shadow-soft transition-colors hover:border-sun-400 sm:p-6"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sun-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">
              <Megaphone className="h-3.5 w-3.5" /> Important Notice
            </span>
            <span className="text-xs text-slate2">Published {formatDate(important.date)}</span>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-ink sm:text-xl">{important.title}</h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-charcoal">{important.excerpt}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700">
            Read notice <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}

      {/* ============ Calendar + Notices ============ */}
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)]">
        {/* Calendar — browse any month; phones see the Notices panel only. */}
        <div className="hidden rounded-xl2 border border-mist bg-white p-6 shadow-soft md:block lg:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{monthLabel}</h2>
            <div className="flex gap-1">
              <button onClick={() => moveMonth(-1)} aria-label="Previous month"
                className="grid h-9 w-9 place-items-center rounded-lg border border-mist text-slate2 transition-colors hover:border-ink/40 hover:text-ink">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => moveMonth(1)} aria-label="Next month"
                className="grid h-9 w-9 place-items-center rounded-lg border border-mist text-slate2 transition-colors hover:border-ink/40 hover:text-ink">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-7 text-center text-xs font-bold uppercase tracking-wide text-slate2" aria-hidden>
            {WEEKDAYS.map((w) => <span key={w} className="py-1">{w}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-y-2 text-center">
            {Array.from({ length: firstWeekday }).map((_, i) => <span key={`b${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const iso = isoOf(calYear, calMonth, i + 1);
              const has = postDates.has(iso);
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  onClick={() => has && setSelectedDate(iso)}
                  disabled={!has}
                  title={has ? `Read posts from ${formatDate(iso)}` : undefined}
                  aria-label={has ? `Show posts from ${formatDate(iso)}` : undefined}
                  className={`relative mx-auto grid h-10 w-10 place-items-center rounded-full text-[15px] lg:h-11 lg:w-11 transition-colors ${isToday ? "border-2 border-teal-600 font-semibold text-teal-800"
                      : has ? "font-semibold text-ink hover:bg-teal-50"
                        : "cursor-default text-slate2/50"
                    }`}
                >
                  {i + 1}
                  {has && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-teal-600" aria-hidden />}
                </button>
              );
            })}
          </div>
          <p className="mt-6 flex items-center gap-2 border-t border-mist pt-5 text-xs text-slate2">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" aria-hidden /> Dotted dates have news or notices — tap one to read them.
          </p>
        </div>

        {/* Notices — viewed month first, older months fill to 5. */}
        <div id="notices" className="flex flex-col scroll-mt-28 rounded-xl2 border border-mist bg-white p-6 shadow-soft lg:p-8">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
              <CalendarDays className="h-4 w-4 text-teal-700" /> Notices
            </h2>
            <span className="text-xs text-slate2">{new Date(calYear, calMonth, 1).toLocaleString("en", { month: "long" })}</span>
          </div>
          {latestNotices.length === 0 ? (
            <div className="mt-6 text-center">
              <p className="text-sm font-medium text-ink">No notices published yet</p>
              <p className="mt-1 text-sm text-slate2">New notices will appear here as soon as the school publishes them.</p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-mist">
              {latestNotices.map((p) => {
                const { day, mon } = monthDay(p.date);
                const isUpcoming = p.date >= today;
                return (
                  <li key={p.slug}>
                    <Link href={`/news/${p.slug}`} className="group flex items-center gap-4 py-4 first:pt-1 last:pb-1">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl2 bg-teal-50 text-center" aria-hidden>
                        <div>
                          <p className="text-xl font-extrabold leading-none text-teal-900">{day}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">{mon}</p>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={tone(p.category)}>{p.category}</Badge>
                          {isUpcoming ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700">
                              <Clock className="h-3 w-3" aria-hidden /> {daysAway(p.date, today)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate2">{formatDate(p.date)}</span>
                          )}
                          {p.attachment && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate2"><Paperclip className="h-3 w-3" /> PDF</span>
                          )}
                        </div>
                        <p className="mt-1 truncate font-semibold leading-snug text-ink group-hover:text-teal-800">{p.title}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate2 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ============ Popup: posts of the picked calendar day ============ */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Posts from ${formatDate(selectedDate)}`}
        >
          <button
            aria-label="Close"
            onClick={() => setSelectedDate(null)}
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
          />
          <div className="relative w-full max-w-lg rounded-xl2 border border-mist bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3 border-b border-mist pb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
                {formatDate(selectedDate)}
              </h2>
              <button
                onClick={() => setSelectedDate(null)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-lg border border-mist text-slate2 hover:border-ink/40 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="max-h-[60vh] divide-y divide-mist overflow-y-auto">
              {dayPosts.map((p) => (
                <li key={p.slug}>
                  <Link href={`/news/${p.slug}`} className="group block py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={tone(p.category)}>{p.category}</Badge>
                      {p.important && <Badge tone="sun">Important</Badge>}
                      {p.attachment && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate2"><Paperclip className="h-3 w-3" /> PDF available</span>
                      )}
                    </div>
                    <h3 className="mt-1.5 font-semibold leading-snug text-ink group-hover:text-teal-800">{p.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate2">{p.excerpt}</p>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700">
                      Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}