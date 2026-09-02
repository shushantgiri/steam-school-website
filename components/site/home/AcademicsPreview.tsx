import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { SectionHead } from "@/components/site/Section";
import { ButtonLink } from "@/components/ui/Button";
import { programs } from "@/lib/content";

import { getHomepage, withMark } from "@/lib/homepage";

export default async function AcademicsPreview() {
  const { academics: sec } = await getHomepage();
  const featured = programs.find((p) => p.featured)!;
  const rest = programs.filter((p) => !p.featured).slice(0, 4);
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow={sec.eyebrow} title={<>{withMark(sec.heading, sec.markWord).map((p, i) => p.mark ? <span key={i} className="mark">{p.text}</span> : <span key={i}>{p.text}</span>)}</>} />
          <Reveal><ButtonLink href={sec.primaryHref} variant="outline">{sec.primaryLabel}</ButtonLink></Reveal>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal className="img-zoom group relative flex min-h-[380px] flex-col justify-end overflow-hidden rounded-xl2 sm:min-h-[460px] lg:row-span-2 lg:min-h-full">
            <Image src={featured.image} alt={featured.name} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
            <div className="relative p-7 text-white sm:p-9">
              <span className="rounded-full bg-teal-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Signature Program</span>
              <h3 className="mt-4 text-2xl font-semibold sm:text-3xl">{featured.name}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">{featured.description}</p>
              <Link href="/academics" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-200 hover:text-white">
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2">
            {rest.map((p, i) => (
              <Reveal key={p.slug} delay={i * 70} className="group overflow-hidden rounded-xl2 border border-mist bg-white shadow-soft transition-shadow hover:shadow-lift">
                <Link href="/academics" className="block">
                  <div className="img-zoom relative aspect-[16/10] overflow-hidden">
                    <Image src={p.image} alt={p.name} fill sizes="(min-width:640px) 25vw, 100vw" className="object-cover" />
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">{p.ages}</p>
                    <h3 className="mt-1 font-semibold text-ink">{p.name}</h3>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
