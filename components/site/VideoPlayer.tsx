"use client";
import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

/**
 * Poster with a play button; on play, embeds YouTube/Vimeo (privacy-friendly,
 * autoplay) or plays a direct video file. Nothing loads until the visitor
 * clicks, so the homepage stays fast.
 */
export default function VideoPlayer({ url, poster, title }: { url: string; poster: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const embed = toEmbed(url);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl2 bg-ink shadow-lift">
      {playing ? (
        embed.kind === "file" ? (
          <video src={embed.src} controls autoPlay playsInline className="h-full w-full" />
        ) : (
          <iframe src={embed.src} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full" />
        )
      ) : (
        <button onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`} className="group absolute inset-0 block h-full w-full text-left">
          {poster && <Image src={poster} alt="" fill sizes="(min-width:1024px) 60vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}
          <span className="absolute inset-0 bg-ink/30 transition group-hover:bg-ink/40" />
          <span className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-teal-700 shadow-lift transition group-hover:scale-105">
            <Play className="ml-1 h-8 w-8" fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}

function toEmbed(url: string): { kind: "youtube" | "vimeo" | "file"; src: string } {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "vimeo", src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1` };
  return { kind: "file", src: url };
}
