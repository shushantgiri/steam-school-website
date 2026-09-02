import Image from "next/image";
import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/Section";
import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { programs } from "@/lib/content";
import { getSiteImageOverrides, resolveSiteImage } from "@/lib/site-images";
import CTA from "@/components/site/home/CTA";

export const metadata: Metadata = { title: "Academics" };

export default async function AcademicsPage() {
  // Photos set in the Media Library override the built-in defaults.
  const chosen = await getSiteImageOverrides();
  const photo = (p: { slot?: string; image: string }) =>
    p.slot ? resolveSiteImage(chosen, p.slot, p.image) : p.image;
  const featured = programs.find((p) => p.featured)!;
  const rest = programs.filter((p) => !p.featured);
  return (
    <>
      <PageHero
        eyebrow="Academics"
        title={<>Programs built for every <span className="mark">stage</span></>}
        lead="From a child's first day in Nursery to Grade 10 board exams, each program builds on the last — and STEAM thinking runs through all of them."
      />
      <Section>
        <Reveal className="grid overflow-hidden rounded-xl2 border border-mist bg-white shadow-soft lg:grid-cols-2">
          <div className="img-zoom relative min-h-[280px] overflow-hidden sm:min-h-[360px]">
            <Image src={photo(featured)} alt={featured.name} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <span className="w-fit rounded-full bg-sun-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">Signature Program</span>
            <h2 className="display mt-4 text-2xl sm:text-3xl">{featured.name}</h2>
            <p className="mt-2 text-sm font-medium text-teal-700">{featured.ages}</p>
            <p className="mt-4 leading-relaxed text-slate2">{featured.description}</p>
            <ButtonLink href="/admissions/apply" className="mt-6 w-fit">Apply for a Seat</ButtonLink>
          </div>
        </Reveal>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p, i) => (
            <Reveal key={p.slug} delay={i * 60} className="group overflow-hidden rounded-xl2 border border-mist bg-white shadow-soft transition-shadow hover:shadow-lift">
              <div className="img-zoom relative aspect-[16/10] overflow-hidden">
                <Image src={photo(p)} alt={p.name} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">{p.ages}</p>
                <h3 className="mt-1 text-lg font-semibold text-ink">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate2">{p.description}</p>
                <ButtonLink href="/admissions" variant="ghost" size="sm" className="mt-4 -ml-2">Learn More</ButtonLink>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
      <CTA />
    </>
  );
}
