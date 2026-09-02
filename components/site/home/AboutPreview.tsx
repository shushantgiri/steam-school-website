import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { img } from "@/lib/images";

import { getHomepage, withMark } from "@/lib/homepage";

export default async function AboutPreview() {
  const { about } = await getHomepage();
  return (
    <section id="latest" style={{ scrollMarginTop: "5rem" }} className="bg-paper">
      <div className="mx-auto grid max-w-shell items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-20 lg:py-32">
        <Reveal className="img-zoom relative aspect-[4/3] overflow-hidden rounded-xl2 lg:aspect-[5/4]">
          <Image src={about.image || img.about} alt="A teacher guiding students through a lesson" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
        </Reveal>
        <div>
          <Reveal>
            <p className="eyebrow">{about.eyebrow || "About the School"}</p>
            <h2 className="display mt-4 text-3xl sm:text-4xl lg:text-[2.75rem]">
              {withMark(about.headingTop, about.markWord).map((p, i) => p.mark ? <span key={i} className="mark">{p.text}</span> : <span key={i}>{p.text}</span>)} <br className="hidden sm:block" /> {withMark(about.headingBottom, about.markWord).map((p, i) => p.mark ? <span key={i} className="mark">{p.text}</span> : <span key={i}>{p.text}</span>)}
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-charcoal">{about.description}</p>
            <ButtonLink href={about.primaryHref} className="mt-6">Discover Our School <ArrowRight className="h-4 w-4" /></ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
