import Image from "next/image";
import Link from "next/link";
import { Atom, Cpu, Wrench, Palette, Calculator, Trophy } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { getPublicPhotos } from "@/lib/gallery";
import { getSiteImageOverrides } from "@/lib/site-images";
import { img } from "@/lib/images";

const DISCIPLINES = [
  { key: "science", slot: "home-learning-science", letter: "S", label: "Science", line: "Explore & experiment", icon: Atom, match: /scien|lab|experiment/i, fallback: img.science },
  { key: "technology", slot: "home-learning-technology", letter: "T", label: "Technology", line: "Build & innovate", icon: Cpu, match: /tech|computer|coding|ict/i, fallback: img.technology },
  { key: "engineering", slot: "home-learning-engineering", letter: "E", label: "Engineering", line: "Design & create", icon: Wrench, match: /engineer|robot|steam|project/i, fallback: img.engineering },
  { key: "arts", slot: "home-learning-arts", letter: "A", label: "Arts", line: "Create & express", icon: Palette, match: /art|music|dance|drawing|creativ/i, fallback: img.arts },
  { key: "math", slot: "home-learning-math", letter: "M", label: "Mathematics", line: "Think & analyse", icon: Calculator, match: /math|class|lesson/i, fallback: img.math },
  { key: "sports", slot: "home-learning-sports", letter: "+", label: "Sports", line: "Stay active & healthy", icon: Trophy, match: /sport|football|game|play/i, fallback: img.sports },
];

/**
 * Learning Beyond the Classroom — S·T·E·A·M·+ spelled inside the photos.
 *
 * One row of six tiles. Each photo carries a soft dark overlay with only its big
 * white letter in the bottom-left corner. Hovering
 * (or keyboard-focusing) a tile lifts the overlay away — the photo comes
 * back to full colour and gently widens and zooms — and the discipline
 * name and tagline slide in beside the letter, in the same direction. On touch screens the row
 * swipes horizontally with the same look. Photos come from the Media
 * Library slots first, then matching gallery photos, then the defaults.
 */
export default async function LifeAtSchool() {
  const [photos, chosen] = await Promise.all([getPublicPhotos(), getSiteImageOverrides()]);
  const used = new Set<string>();
  const tiles = DISCIPLINES.map((d) => {
    if (chosen[d.slot]) return { ...d, src: chosen[d.slot] };
    const hit = photos.find((p) => !used.has(p.src) && d.match.test(`${p.category} ${p.alt}`));
    if (hit) used.add(hit.src);
    return { ...d, src: hit?.src || d.fallback };
  });

  return (
    <section className="bg-ivory" aria-labelledby="beyond-heading">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">Learning</p>
          <h2 id="beyond-heading" className="display mt-3 text-3xl sm:text-4xl lg:text-5xl">
            Learning beyond the <span className="mark">classroom</span>
          </h2>
          <p className="mt-4 text-base text-charcoal sm:text-lg">
            Five letters, one way of thinking — and sports to keep it all moving.
          </p>
        </Reveal>

        {/* Desktop & tablet: one row, letters living inside the photos. */}
        <Reveal className="mt-12 lg:mt-16">
          <div className="hidden h-[400px] gap-3 md:flex lg:h-[460px]" role="list">
            {tiles.map(({ key, letter, label, line, icon: Icon, src }) => (
              <Link
                key={key}
                role="listitem"
                href="/gallery"
                aria-label={`${label} — ${line}. Browse photos in the gallery.`}
                className="group relative min-w-0 flex-1 overflow-hidden rounded-xl2 outline-none ring-1 ring-ink/5 transition-[flex-grow] duration-500 ease-out hover:flex-[2.1] focus-visible:flex-[2.1] focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory motion-reduce:transition-none"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width:1024px) 35vw, 45vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05] motion-reduce:transition-none"
                />

                {/* The overlay: a gentle darkening at rest, gone on hover. */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/30 to-ink/15 transition-opacity duration-500 group-hover:opacity-0 group-focus-visible:opacity-0 motion-reduce:transition-none"
                />

                <span className="absolute right-3.5 top-3.5 grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors duration-300 group-hover:bg-sun-400 group-hover:text-ink">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>

                {/* Letter + name — their own drop shadow keeps them readable once the overlay lifts. */}
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4 lg:p-5 [text-shadow:0_2px_14px_rgba(16,28,51,0.65)]">
                  <p aria-hidden className="shrink-0 text-6xl font-extrabold leading-none tracking-tight text-white lg:text-7xl">
                    {letter}
                  </p>
                  {/* Name + tagline slide in to the RIGHT of the letter — the same
                      direction the tile itself grows — only on hover/focus. */}
                  <div className="grid min-w-0 grid-cols-[0fr] transition-[grid-template-columns] duration-500 ease-out group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr] motion-reduce:transition-none">
                    <div className="min-w-0 overflow-hidden">
                      <p className="whitespace-nowrap text-base font-semibold leading-tight text-white opacity-0 transition-opacity delay-100 duration-400 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none lg:text-lg">{label}</p>
                      <p className="whitespace-nowrap text-xs text-white/85 opacity-0 transition-opacity delay-150 duration-400 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none lg:text-sm">{line}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Touch screens: the same look in a swipeable row. */}
          <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:hidden" role="list">
            {tiles.map(({ key, letter, label, line, icon: Icon, src }) => (
              <Link
                key={key}
                role="listitem"
                href="/gallery"
                aria-label={`${label} — ${line}. Browse photos in the gallery.`}
                className="relative aspect-[3/4] w-[64%] shrink-0 snap-center overflow-hidden rounded-xl2 ring-1 ring-ink/5"
              >
                <Image src={src} alt="" fill sizes="70vw" className="object-cover" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-ink/10" />
                <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur-sm">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4 [text-shadow:0_2px_12px_rgba(16,28,51,0.6)]">
                  <p aria-hidden className="text-5xl font-extrabold leading-none tracking-tight text-white">{letter}</p>
                  <p className="mt-1.5 text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-white/85">{line}</p>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}