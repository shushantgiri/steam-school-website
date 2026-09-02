"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarX2 } from "lucide-react";
import type { CalCategory, CalEvent } from "@/lib/types";

const catColor: Record<CalCategory, string> = {
  Exam: "bg-ink", Holiday: "bg-sun-400", Event: "bg-teal-600",
  Program: "bg-teal-100 border border-teal-600", Meeting: "bg-slate2", Important: "bg-red-500",
};
const cats = Object.keys(catColor) as CalCategory[];
const monthName = (d: Date) => d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** yyyy-mm → the first of that month; falls back to the first entry, then today. */
function openingMonth(initialMonth: string | undefined, events: CalEvent[]) {
  const key = initialMonth || events[0]?.date.slice(0, 7);
  if (key && /^\d{4}-\d{2}$/.test(key)) {
    return new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default function SchoolCalendar({
  events,
  initialMonth,
}: {
  events: CalEvent[];
  /** Month to open on, as yyyy-mm. Pass it from the server to keep SSR stable. */
  initialMonth?: string;
}) {
  const [cursor, setCursor] = useState(() => openingMonth(initialMonth, events));
  const [selected, setSelected] = useState<string | null>(null);

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = (first.getDay() + 7) % 7; // Sunday first
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: start }, () => null);
    for (let d = 1; d <= days; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const monthEvents = events.filter((e) => e.date.startsWith(iso(cursor).slice(0, 7)));
  const listed = selected ? monthEvents.filter((e) => e.date === selected) : monthEvents;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-xl2 border border-mist bg-white p-4 shadow-soft sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{monthName(cursor)}</h2>
          <div className="flex gap-2">
            <button
              aria-label="Previous month"
              onClick={() => { setSelected(null); setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)); }}
              className="grid h-9 w-9 place-items-center rounded-full border border-mist hover:bg-ivory"
            ><ChevronLeft className="h-4 w-4" /></button>
            <button
              aria-label="Next month"
              onClick={() => { setSelected(null); setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)); }}
              className="grid h-9 w-9 place-items-center rounded-full border border-mist hover:bg-ivory"
            ><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wider text-slate2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            if (!d) return <div key={i} />;
            const key = iso(d);
            const dayEvents = events.filter((e) => e.date === key);
            const isSel = selected === key;
            return (
              <button
                key={key}
                onClick={() => setSelected(isSel ? null : key)}
                aria-pressed={isSel}
                aria-label={`${d.getDate()} ${monthName(cursor)}${dayEvents.length ? `, ${dayEvents.length} item(s)` : ""}`}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-sm transition-colors sm:aspect-[4/3] ${
                  isSel ? "bg-ink text-white" : dayEvents.length ? "bg-ivory hover:bg-mist" : "hover:bg-ivory"
                }`}
              >
                <span className="font-medium">{d.getDate()}</span>
                {dayEvents.length > 0 && (
                  <span className="flex gap-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${isSel ? "bg-sun-400" : catColor[e.category]}`} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-mist pt-4">
          {cats.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 text-xs text-slate2">
              <span className={`h-2 w-2 rounded-full ${catColor[c]}`} /> {c}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate2">
          {selected ? "On this day" : "This month"}
        </h3>
        {listed.length === 0 ? (
          <div className="mt-4 grid place-items-center rounded-xl2 border border-dashed border-mist bg-white py-14 text-center">
            <CalendarX2 className="h-7 w-7 text-slate2" aria-hidden />
            <p className="mt-3 text-sm font-medium text-ink">No entries {selected ? "on this day" : "this month"}</p>
            <p className="mt-1 px-6 text-xs text-slate2">Use the arrows to browse other months.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {listed.map((e) => (
              <li key={e.id} className="flex gap-4 rounded-xl2 border border-mist bg-white p-4 shadow-soft">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${catColor[e.category]}`} aria-hidden />
                <div>
                  <p className="text-xs font-medium text-slate2">
                    {new Date(e.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    {e.time && ` · ${e.time}`}{e.location && ` · ${e.location}`}
                  </p>
                  <p className="mt-0.5 font-medium text-ink">{e.title}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wider text-teal-700">{e.category}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
