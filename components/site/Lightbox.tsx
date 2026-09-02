"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type LightboxPhoto = { src: string; alt: string };

/**
 * Masonry photo grid with a simple lightbox: tap a photo to view it large,
 * arrow keys / buttons to move, Escape or the backdrop to close.
 */
export default function PhotoMasonry({ photos }: { photos: LightboxPhoto[] }) {
  const [i, setI] = useState<number | null>(null);
  const has = i !== null;

  useEffect(() => {
    if (!has) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setI(null);
      if (e.key === "ArrowRight") setI((n) => (n === null ? n : (n + 1) % photos.length));
      if (e.key === "ArrowLeft") setI((n) => (n === null ? n : (n - 1 + photos.length) % photos.length));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [has, photos.length]);

  return (
    <>
      <div className="columns-2 gap-3 sm:gap-4 md:columns-3 lg:columns-4">
        {photos.map((p, n) => (
          <button key={p.src + n} onClick={() => setI(n)} aria-label={`Open photo: ${p.alt}`}
            className="group mb-3 block w-full overflow-hidden rounded-xl2 bg-ivory sm:mb-4 [break-inside:avoid]">
            <div className={`relative ${n % 3 === 0 ? "aspect-[4/5]" : n % 3 === 1 ? "aspect-square" : "aspect-[4/3]"}`}>
              <Image src={p.src} alt={p.alt} fill sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
          </button>
        ))}
      </div>

      {has && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/90 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <button aria-label="Close" onClick={() => setI(null)} className="absolute inset-0" />
          <div className="relative h-full w-full max-w-5xl">
            <Image src={photos[i!].src} alt={photos[i!].alt} fill sizes="100vw" className="object-contain" priority />
          </div>
          <button onClick={() => setI(null)} aria-label="Close photo" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30"><X className="h-5 w-5" /></button>
          {photos.length > 1 && (
            <>
              <button onClick={() => setI((n) => ((n ?? 0) - 1 + photos.length) % photos.length)} aria-label="Previous photo" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={() => setI((n) => ((n ?? 0) + 1) % photos.length)} aria-label="Next photo" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30"><ChevronRight className="h-5 w-5" /></button>
            </>
          )}
          {photos[i!].alt && <p className="absolute bottom-4 left-1/2 max-w-[90vw] -translate-x-1/2 truncate text-center text-sm text-white/80">{photos[i!].alt}</p>}
        </div>
      )}
    </>
  );
}
