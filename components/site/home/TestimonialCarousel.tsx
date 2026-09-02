"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

type Item = { id: string; name: string; role: string; quote: string };

/**
 * The family-voices carousel. Desktop shows three cards — the centre one in
 * focus, its neighbours smaller and quieter; mobile shows one at a time with
 * swipe. Rotates on its own every 6 seconds in an endless loop (…last → first
 * with no visible jump, because neighbours are computed modulo the list),
 * pauses whenever the reader hovers, focuses or touches it, and sits still
 * under prefers-reduced-motion.
 */
export default function TestimonialCarousel({ items }: { items: Item[] }) {
  const n = items.length;
  const [center, setCenter] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const go = useCallback((delta: number) => setCenter((c) => ((c + delta) % n + n) % n), [n]);

  // A tap or swipe pauses rotation for a while, then it quietly resumes.
  const interact = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 12000);
  }, []);
  useEffect(() => () => { if (resumeTimer.current) clearTimeout(resumeTimer.current); }, []);

  useEffect(() => {
    if (n < 2 || paused || reduced) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [n, paused, reduced, go]);

  const at = (offset: number) => items[((center + offset) % n + n) % n];

  const Card = ({ t, focus }: { t: Item; focus: boolean }) => (
    <figure
      className={`flex h-full flex-col rounded-xl2 border bg-ivory/60 p-6 transition-all duration-700 ease-out motion-reduce:transition-none ${
        focus
          ? "border-teal-200 shadow-lift"
          : "scale-[0.94] border-mist opacity-50 shadow-soft blur-[0.5px]"
      }`}
    >
      <Quote className="h-6 w-6 text-teal-600" aria-hidden />
      <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-charcoal">“{t.quote}”</blockquote>
      <figcaption className="mt-5 border-t border-mist pt-4">
        <p className="font-semibold text-ink">{t.name}</p>
        {t.role && <p className="text-sm text-slate2">{t.role}</p>}
      </figcaption>
    </figure>
  );

  return (
    <div
      className="mt-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Desktop: three across, centre in focus. */}
      <div className="hidden items-stretch gap-6 md:grid md:grid-cols-3" aria-live="off">
        {n >= 3 ? (
          <>
            <Card t={at(-1)} focus={false} />
            <Card t={at(0)} focus />
            <Card t={at(1)} focus={false} />
          </>
        ) : (
          items.map((t, i) => <Card key={t.id} t={t} focus={i === center || n === 1} />)
        )}
      </div>

      {/* Mobile: one card, swipeable. */}
      <div
        className="md:hidden"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; interact(); }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <Card t={at(0)} focus />
      </div>

      {n > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => { go(-1); interact(); }}
            aria-label="Previous testimonial"
            className="grid h-10 w-10 place-items-center rounded-full border border-mist bg-white text-ink transition-colors hover:border-teal-300 hover:text-teal-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-2">
            {items.map((t, i) => (
              <button
                key={t.id}
                onClick={() => { setCenter(i); interact(); }}
                aria-label={`Show testimonial from ${t.name}`}
                aria-current={i === center}
                className={`h-2 rounded-full transition-all ${i === center ? "w-5 bg-teal-600" : "w-2 bg-mist hover:bg-slate2/50"}`}
              />
            ))}
          </div>
          <button
            onClick={() => { go(1); interact(); }}
            aria-label="Next testimonial"
            className="grid h-10 w-10 place-items-center rounded-full border border-mist bg-white text-ink transition-colors hover:border-teal-300 hover:text-teal-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
