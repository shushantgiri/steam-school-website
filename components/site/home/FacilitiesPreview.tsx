import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { SectionHead } from "@/components/site/Section";
import { ButtonLink } from "@/components/ui/Button";
import { facilities } from "@/lib/content";

import { getHomepage, withMark } from "@/lib/homepage";

export default async function FacilitiesPreview() {
  const { facilities: sec } = await getHomepage();
  const [feature, ...rest] = facilities;
  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-20 lg:py-28">
        <SectionHead eyebrow={sec.eyebrow} title={<>{withMark(sec.heading, sec.markWord).map((p, i) => p.mark ? <span key={i} className="mark">{p.text}</span> : <span key={i}>{p.text}</span>)}</>} />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <Reveal className="img-zoom relative min-h-[320px] overflow-hidden rounded-xl2 sm:min-h-[420px] lg:col-span-2">
            <Image src={feature.image} alt={feature.name} fill sizes="(min-width:1024px) 66vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 p-7 text-white sm:p-9">
              <h3 className="text-2xl font-semibold">{feature.name}</h3>
              <p className="mt-1 text-sm text-white/80">{feature.line}</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-1">
            {rest.slice(0, 2).map((f, i) => (
              <Reveal key={f.name} delay={i * 80} className="img-zoom relative min-h-[180px] overflow-hidden rounded-xl2 sm:min-h-[196px]">
                <Image src={f.image} alt={f.name} fill sizes="(min-width:1024px) 33vw, 50vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />
                <p className="absolute bottom-4 left-5 text-sm font-semibold text-white">{f.name}</p>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal className="mt-10"><ButtonLink href={sec.primaryHref} variant="outline">{sec.primaryLabel}</ButtonLink></Reveal>
      </div>
    </section>
  );
}
