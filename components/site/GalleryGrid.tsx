"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { GalleryPhoto } from "@/lib/gallery";

const cats = [
  "All", "School Life", "STEAM", "Sports", "Events", "Classroom", "Trips", "Competitions", "Cultural Programs",
] as const;

export default function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const [open, setOpen] = useState<number | null>(null);
  const items = cat === "All" ? photos : photos.filter((g) => g.category === cat);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % items.length));
      if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + items.length) % items.length));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, items.length]);

  return (
    <div>
      <div role="tablist" aria-label="Filter gallery" className="nice-scroll -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
        {cats.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={cat === c}
            onClick={() => { setCat(c); setOpen(null); }}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              cat === c ? "border-ink bg-ink text-white" : "border-mist bg-white text-charcoal hover:border-ink/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-xl2 border border-dashed border-mist bg-white py-20 text-center">
          <ImageOff className="h-8 w-8 text-slate2" aria-hidden />
          <p className="mt-3 font-medium text-ink">No photos in this category yet</p>
          <p className="mt-1 text-sm text-slate2">New albums are added throughout the year.</p>
        </div>
      ) : (
        <div className="mt-8 columns-2 gap-4 md:columns-3 [column-fill:_balance]">
          {items.map((g, i) => (
            <button
              key={g.src + i}
              onClick={() => setOpen(i)}
              className={`img-zoom group relative mb-4 block w-full overflow-hidden rounded-xl2 ${g.tall ? "aspect-[3/4]" : "aspect-[4/3]"}`}
              aria-label={`Open photo: ${g.alt}`}
            >
              <Image src={g.src} alt={g.alt} fill sizes="(min-width:768px) 33vw, 50vw" className="object-cover" unoptimized={g.src.startsWith("/uploads/")} />
              <span className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink/70 to-transparent p-3 text-left text-xs font-medium text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                {g.category}
              </span>
            </button>
          ))}
        </div>
      )}

      {open !== null && items[open] && (
        <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-[80] flex flex-col bg-ink/95 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4 text-white sm:p-6">
            <span className="text-sm text-white/70">{open + 1} / {items.length}</span>
            <button onClick={() => setOpen(null)} aria-label="Close viewer" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative mx-auto w-full max-w-5xl flex-1 px-4 pb-4 sm:px-16">
            <div className="relative h-full min-h-[50vh] overflow-hidden rounded-xl2">
              <Image src={items[open].src} alt={items[open].alt} fill sizes="100vw" className="object-contain" unoptimized={items[open].src.startsWith("/uploads/")} />
            </div>
            <button
              onClick={() => setOpen((open - 1 + items.length) % items.length)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4"
            ><ChevronLeft className="h-5 w-5" /></button>
            <button
              onClick={() => setOpen((open + 1) % items.length)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4"
            ><ChevronRight className="h-5 w-5" /></button>
          </div>
          <p className="pb-6 text-center text-sm text-white/70">{items[open].alt}</p>
        </div>
      )}
    </div>
  );
}
