import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import { img } from "@/lib/images";
import { ButtonLink } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import HeroParallax from "./HeroParallax";
import { getHomepage, withMark } from "@/lib/homepage";

/**
 * Hero — a full-bleed school photograph with a deep-navy gradient rising
 * from the left, so the photo stays the star while the text reads
 * effortlessly. Small label with a rule, two-line heading with one teal
 * word, one sentence, two buttons, a quiet scroll cue. Gentle parallax on
 * desktop. All text is managed in Admin → Homepage.
 */
export default async function Hero() {
  const { hero } = await getHomepage();
  const top = withMark(hero.headingTop, hero.markWord);
  const bottom = withMark(hero.headingBottom, hero.markWord);
  const line = (parts: ReturnType<typeof withMark>) =>
    parts.map((p, i) => (p.mark ? <span key={i} className="mark">{p.text}</span> : <span key={i}>{p.text}</span>));

  return (
    <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden bg-ink text-white lg:min-h-[92svh]">
      <HeroParallax>
        <Image src={hero.image || img.hero} alt="Students learning together" fill priority sizes="100vw" className="object-cover" />
      </HeroParallax>
      {/* Overlays: legibility from the left, a soft base for the buttons */}
      <div className="absolute inset-0 -z-0 bg-gradient-to-r from-ink/90 via-ink/55 to-ink/10" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/80 to-transparent" />

      <div className="relative mx-auto w-full max-w-shell px-5 pb-16 pt-40 sm:px-8 sm:pb-24 sm:pt-48 lg:pb-28">
        <Reveal className="max-w-3xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-200">
            <span className="h-px w-8 bg-teal-200/70" aria-hidden />
            {hero.eyebrow}
          </p>
          <h1 className="display mt-6 text-[2.6rem] leading-[1.04] !text-white sm:text-6xl lg:text-7xl">
            {line(top)}<br />{line(bottom)}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">{hero.description}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href={hero.secondaryHref || "/about"} size="lg">{hero.secondaryLabel || "Explore Our School"} <ArrowRight className="h-4 w-4" /></ButtonLink>
            <ButtonLink href={hero.primaryHref || "/admissions"} variant="light" size="lg" className="!border-white/40 !bg-white/10 !text-white backdrop-blur hover:!bg-white/20">
              {hero.primaryLabel || "Admissions"} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Reveal>
      </div>

      <a href="#latest" aria-label="Scroll to content" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-white/60 transition hover:text-white motion-safe:animate-bounce sm:block">
        <ChevronDown className="h-6 w-6" />
      </a>
    </section>
  );
}
