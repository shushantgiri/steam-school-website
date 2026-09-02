"use client";
import { useEffect, useRef } from "react";

/**
 * Gentle parallax for the hero photo: the image drifts at a third of the
 * scroll speed. Desktop pointers only, off under prefers-reduced-motion,
 * and never more than 12% so the image always covers the section.
 */
export default function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight) * 0.22;
        el.style.transform = `translate3d(0, ${y}px, 0) scale(1.08)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className="absolute inset-0 will-change-transform" style={{ transform: "scale(1.08)" }}>{children}</div>;
}
