import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getHomepage } from "@/lib/homepage";
import { getPublicPhotos } from "@/lib/gallery";
import { getSiteImageOverrides } from "@/lib/site-images";
import { img } from "@/lib/images";

const WORDS = ["Curiosity", "Creativity", "Confidence", "Collaboration"];

/**
 * Student Experience — one large photo with a smaller supporting photo
 * tucked over its corner; a short message and four words in confident type.
 */
export default async function StudentExperience() {
  const [{ studentLife }, photos, chosen] = await Promise.all([getHomepage(), getPublicPhotos(), getSiteImageOverrides()]);
  const pick = (re: RegExp, skip?: string) => photos.find((p) => p.src !== skip && re.test(`${p.category} ${p.alt}`))?.src;
  const main = chosen["home-student-main"] || pick(/student|class|learn|project/i) || img.studentsOutdoor;
  const small = chosen["home-student-small"] || pick(/art|sport|celebrat|event|music/i, main) || img.artRoom;
  return (
    <section className="bg-white" aria-labelledby="students-heading">
      <div className="mx-auto grid max-w-shell items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20 lg:py-32">
        <Reveal className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl2 shadow-soft">
            <Image src={main} alt="Students at work" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-6 -right-3 w-2/5 overflow-hidden rounded-xl2 border-4 border-white shadow-lift sm:-right-6">
            <div className="relative aspect-square">
              <Image src={small} alt="Students in a creative activity" fill sizes="20vw" className="object-cover" />
            </div>
          </div>
        </Reveal>
        <Reveal delay={120} className="pt-6 lg:pt-0">
          <p className="eyebrow">Student Experience</p>
          <h2 id="students-heading" className="display mt-3 text-3xl sm:text-4xl lg:text-5xl">Every student has something to <span className="mark">discover</span>.</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-charcoal sm:text-lg">We help students build the habits that last: asking good questions, making things, speaking up and working together.</p>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3">
            {WORDS.map((w, i) => (
              <li key={w} className="flex items-baseline gap-3 border-l-2 border-teal-700/40 pl-3">
                <span className="text-xs font-semibold text-teal-700">0{i + 1}</span>
                <span className="text-lg font-semibold text-ink">{w}</span>
              </li>
            ))}
          </ul>
          <ButtonLink href={studentLife.primaryHref || "/student-life"} variant="outline" className="mt-9">{studentLife.primaryLabel || "Explore Student Life"} <ArrowRight className="h-4 w-4" /></ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
