"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  BS_MAX_YEAR,
  BS_MIN_YEAR,
  BS_MONTHS,
  bsDaysInMonth,
  bsDisplay,
  formatBs,
  parseBs,
  todayBs,
} from "@/lib/bs-calendar";

/**
 * Bikram Sambat date picker. The value travels as "YYYY-MM-DD" in BS
 * (e.g. "2068-04-15"). Year and month are dropdowns (fast for birthdays,
 * which are usually decades back), days are a tap-friendly grid, and the
 * month arrows walk across year boundaries. Escape or an outside tap closes
 * it; the trigger is a real button so keyboards and screen readers get a
 * proper control.
 */
export default function BSDatePicker({
  value,
  onChange,
  required,
  id,
  placeholder = "Select date (BS)",
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const fallbackId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const parsed = parseBs(value);
  const initial = parsed ?? todayBs();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  // Reopen on the selected date, not wherever it was last left.
  useEffect(() => {
    if (!open) return;
    const p = parseBs(value) ?? todayBs();
    setYear(p.year);
    setMonth(p.month);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const move = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    if (y < BS_MIN_YEAR || y > BS_MAX_YEAR) return;
    setYear(y);
    setMonth(m);
  };

  const days = bsDaysInMonth(year, month);
  const years: number[] = [];
  for (let y = BS_MAX_YEAR; y >= BS_MIN_YEAR; y--) years.push(y);

  const pick = (day: number) => {
    onChange(formatBs({ year, month, day }));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id ?? fallbackId}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex h-12 w-full items-center justify-between gap-2 rounded-lg border border-mist bg-white px-3 text-left text-sm transition-colors focus:border-teal-600 ${
          parsed ? "text-ink" : "text-slate2"
        }`}
      >
        <span className="truncate">
          {parsed ? `${bsDisplay(value)} · BS` : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {parsed && !required && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onChange(""); } }}
              className="grid h-6 w-6 place-items-center rounded-full text-slate2 hover:bg-ivory hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <Calendar className="h-4 w-4 text-slate2" aria-hidden />
        </span>
      </button>
      {/* Hidden input keeps native form "required" behaviour working. */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => undefined}
          className="pointer-events-none absolute inset-0 h-px w-px opacity-0"
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Choose a Bikram Sambat date"
          className="absolute left-0 top-[calc(100%+6px)] z-40 w-[19rem] max-w-[calc(100vw-2.5rem)] rounded-xl2 border border-mist bg-white p-3 shadow-lift"
        >
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate2">
            Bikram Sambat (BS)
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous month"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-mist text-ink hover:bg-ivory"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              aria-label="Month"
              className="h-9 min-w-0 flex-1 rounded-lg border border-mist bg-white px-2 text-sm focus:border-teal-600"
            >
              {BS_MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="Year (BS)"
              className="h-9 w-[5.2rem] rounded-lg border border-mist bg-white px-2 text-sm focus:border-teal-600"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next month"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-mist text-ink hover:bg-ivory"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
              const selected =
                !!parsed && parsed.year === year && parsed.month === month && parsed.day === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pick(day)}
                  aria-pressed={selected}
                  className={`grid h-9 w-9 place-items-center rounded-lg text-sm transition-colors ${
                    selected
                      ? "bg-teal-600 font-semibold text-white"
                      : "text-ink hover:bg-teal-50 hover:text-teal-800"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
