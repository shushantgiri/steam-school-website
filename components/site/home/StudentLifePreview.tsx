import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { SectionHead } from "@/components/site/Section";
import { ButtonLink } from "@/components/ui/Button";
import { studentLife } from "@/lib/content";

import { getHomepage, withMark } from "@/lib/homepage";

export default async function StudentLifePreview() {
  const { studentLife: sec } = await getHomepage();
  const tiles = studentLife.slice(0, 5);
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow={sec.eyebrow} title={<>{withMark(sec.heading, sec.markWord).map((p, i) => p.mark ? <span key={i} className="mark">{p.text}</span> : <span key={i}>{p.text}</span>)}</>} />
          <Reveal><ButtonLink href={sec.primaryHref} variant="outline">{sec.primaryLabel}</ButtonLink></Reveal>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {tiles.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 60}
              className={`img-zoom relative overflow-hidden rounded-xl2 ${t.size === "lg" ? "col-span-2 aspect-[16/10] md:aspect-[16/9]" : "aspect-square"}`}
            >
              <Image src={t.image} alt={t.name} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
              <p className="absolute bottom-3 left-4 text-sm font-semibold text-white sm:bottom-4 sm:left-5">{t.name}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
