"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays, Megaphone, Newspaper, X } from "lucide-react";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/format";

/**
 * Announcement popup. Appears a moment after the page opens, once per browser
 * session per announcement (so a family reading three pages isn't nagged, but
 * a new announcement shows again). Closes on the X, the backdrop or Escape.
 * Respects prefers-reduced-motion.
 */
export default function AnnouncementPopup({ post }: { post: Post }) {
  const [open, setOpen] = useState(false);
  const key = `announcement-seen:${post.slug}:${post.date}`;

  useEffect(() => {
    try { if (sessionStorage.getItem(key)) return; } catch { /* storage unavailable */ }
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, [key]);

  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const isEvent = post.category === "Event";
  const isNews = post.category === "News";
  const Icon = isEvent ? CalendarDays : isNews ? Newspaper : Megaphone;
  const kind = isEvent ? "Upcoming event" : isNews ? "School news" : post.important ? "Important notice" : "Notice";
  const href = isEvent ? "/events" : `/news/${post.slug}`;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] animate-[fadeIn_.3s_ease-out] motion-reduce:animate-none" onClick={close} />
      <div className="relative w-full max-w-md overflow-hidden rounded-xl2 bg-white shadow-lift animate-[popIn_.35s_cubic-bezier(.2,.9,.3,1.2)] motion-reduce:animate-none">
        <div className="flex items-center gap-3 border-b border-mist bg-ivory px-5 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-700 text-white"><Icon className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">{kind}</p>
            <p className="text-xs text-slate2">{formatDate(post.date)}</p>
          </div>
          <button onClick={close} aria-label="Close announcement" className="grid h-9 w-9 place-items-center rounded-full text-slate2 hover:bg-white hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        {post.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image} alt="" className="h-40 w-full object-cover" />
        )}
        <div className="px-5 py-5">
          <h2 id="announcement-title" className="text-lg font-semibold leading-snug text-ink">{post.title}</h2>
          {post.excerpt && <p className="mt-2 text-sm leading-relaxed text-charcoal">{post.excerpt}</p>}
          <div className="mt-5 flex gap-2">
            <Link href={href} onClick={close}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-600">
              <Bell className="h-4 w-4" /> View Details
            </Link>
            <button onClick={close} className="rounded-full border border-mist bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-ivory">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
