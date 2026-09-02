import Image from "next/image";
import type { Metadata } from "next";
import { PageHero, Section, SectionHead } from "@/components/site/Section";
import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { studentLife } from "@/lib/content";
import { getSiteImageOverrides, resolveSiteImage } from "@/lib/site-images";
import CTA from "@/components/site/home/CTA";

export const metadata: Metadata = { title: "Student Life" };

export default async function StudentLifePage() {
  const chosen = await getSiteImageOverrides();
  const photo = (t: { slot?: string; image: string }) =>
    t.slot ? resolveSiteImage(chosen, t.slot, t.image) : t.image;
  return (
    <>
      <PageHero
        eyebrow="Student Life"
        title={<>More than <span className="mark">classes</span></>}
        lead="Sports, clubs, music, tours, competitions and celebrations — the parts of school students remember for life."
      />
      <Section>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {studentLife.map((t, i) => (
            <Reveal
              key={t.name}
              delay={(i % 4) * 60}
              className={`img-zoom relative overflow-hidden rounded-xl2 ${t.size === "lg" ? "col-span-2 aspect-[16/10]" : "aspect-square"}`}
            >
              <Image src={photo(t)} alt={t.name} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
              <p className="absolute bottom-3 left-4 text-sm font-semibold text-white sm:bottom-4 sm:left-5">{t.name}</p>
            </Reveal>
          ))}
        </div>
      </Section>
      <Section tone="ivory">
        <SectionHead
          eyebrow="Beyond the Timetable"
          title={<>Every student finds a <span className="mark">place</span></>}
          lead="House competitions run all year. Clubs meet every Friday afternoon. Tours leave every term. Whether your child loves the football field, the stage or the soldering iron, there is a home for them here."
        />
        <Reveal className="mt-8"><ButtonLink href="/gallery" variant="outline">Browse the Gallery</ButtonLink></Reveal>
      </Section>
      <CTA />
    </>
  );
}
