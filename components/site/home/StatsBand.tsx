"use client";
import { useEffect, useRef, useState } from "react";

type Stat = { value: string; label: string };

/** "450+" → { number: 450, suffix: "+" }; non-numeric values render as-is. */
const split = (v: string) => {
  const m = v.match(/^([\d,.]+)(.*)$/);
  if (!m) return { number: null as number | null, suffix: v };
  return { number: Number(m[1].replace(/,/g, "")), suffix: m[2] };
};

function CountUp({ value, run }: { value: string; run: boolean }) {
  const { number, suffix } = split(value);
  const [shown, setShown] = useState(number === null ? value : "0");
  const started = useRef(false);

  useEffect(() => {
    if (number === null || !run || started.current) return;
    started.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(value); return; }
    const t0 = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(`${Math.round(number * eased).toLocaleString()}${suffix}`);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [number, suffix, run, value]);

  if (number === null) return <span>{value}</span>;
  const m = shown.match(/^([\d,.]+)(.*)$/);
  return (
    <span>
      {m ? m[1] : shown}
      {m && m[2] && <span className="text-sun-300">{m[2]}</span>}
    </span>
  );
}

/**
 * The school in numbers — one slim dark strip, nothing but the stats.
 * Four cells in a single row (2×2 on phones) with hairline dividers, big
 * tabular numerals with the +/% in the brand yellow, and a short gradient
 * tick under each number. The numbers count up once as the strip scrolls
 * into view; a fine gradient keyline draws across the top at the same
 * moment. Content still comes from the CMS (Admin → Homepage).
 */
export default function StatsBand({ eyebrow, stats }: {
  eyebrow: string;
  /** Kept for compatibility with the server wrapper; not rendered. */
  markParts?: Array<{ text: string; mark: boolean }>;
  stats: Stat[];
}) {
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => { if (e[0].isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-hidden bg-ink py-10 sm:py-12" aria-label={eyebrow}>
      <div aria-hidden className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-sun-400/10 blur-3xl" />
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-teal-500/0 via-teal-400/70 to-sun-400/70 transition-transform duration-1000 ease-out motion-reduce:transition-none ${inView ? "scale-x-100" : "scale-x-0"}`}
      />

      <div className="relative mx-auto grid max-w-shell grid-cols-2 px-5 sm:px-8 md:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={`${s.label}-${i}`}
            className={[
              "flex flex-col items-center px-4 py-5 text-center transition-all duration-500 motion-reduce:transition-none sm:py-6",
              i % 2 !== 0 ? "border-l border-white/10 md:border-l-0" : "",
              i > 0 ? "md:border-l md:border-white/10" : "",
              i >= 2 ? "border-t border-white/10 md:border-t-0" : "",
              inView ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
            ].join(" ")}
            style={{ transitionDelay: inView ? `${i * 80}ms` : "0ms" }}
          >
            <p className="text-4xl font-extrabold tabular-nums tracking-tight text-white sm:text-5xl">
              <CountUp value={s.value} run={inView} />
            </p>
            <span
              aria-hidden
              className={`mt-3 block h-1 w-9 rounded-full bg-gradient-to-r from-teal-500 to-sun-400 transition-transform duration-700 ease-out motion-reduce:transition-none ${inView ? "scale-x-100" : "scale-x-0"}`}
              style={{ transitionDelay: inView ? `${300 + i * 80}ms` : "0ms" }}
            />
            <p className="mt-2.5 text-[13px] font-medium leading-snug text-white/70 sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}