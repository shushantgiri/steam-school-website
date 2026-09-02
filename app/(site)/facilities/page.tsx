import Image from "next/image";
import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/Section";
import Reveal from "@/components/ui/Reveal";
import { facilities } from "@/lib/content";
import { getSiteImageOverrides, resolveSiteImage } from "@/lib/site-images";
import CTA from "@/components/site/home/CTA";

export const metadata: Metadata = { title: "Facilities" };

export default async function FacilitiesPage() {
  const chosen = await getSiteImageOverrides();
  const photo = (f: { slot?: string; image: string }) =>
    f.slot ? resolveSiteImage(chosen, f.slot, f.image) : f.image;
  const [feature, ...rest] = facilities;
  return (
    <>
      <PageHero
        eyebrow="Facilities"
        title={<>Spaces made for <span className="mark">making</span></>}
        lead="Purpose-built classrooms, laboratories and play areas, each designed around how students learn best."
      />
      <Section>
        <Reveal className="img-zoom relative min-h-[320px] overflow-hidden rounded-xl2 sm:min-h-[480px]">
          <Image src={photo(feature)} alt={feature.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 p-7 text-white sm:p-10">
            <p className="eyebrow !text-sun-300">Featured Space</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{feature.name}</h2>
            <p className="mt-2 max-w-md text-white/80">{feature.line}</p>
          </div>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {rest.map((f, i) => (
            <Reveal key={f.name} delay={(i % 3) * 70} className="img-zoom group relative aspect-[4/3] overflow-hidden rounded-xl2">
              <Image src={photo(f)} alt={f.name} fill sizes="(min-width:1024px) 33vw, 50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
              <div className="absolute bottom-0 p-4 text-white sm:p-5">
                <h3 className="text-sm font-semibold sm:text-base">{f.name}</h3>
                <p className="mt-0.5 hidden text-xs text-white/75 sm:block">{f.line}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
      <CTA />
    </>
  );
}
