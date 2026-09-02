import { ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import PhotoMasonry from "@/components/site/Lightbox";
import { ButtonLink } from "@/components/ui/Button";
import { getPublicPhotos } from "@/lib/gallery";

/** Moments That Matter — an editorial gallery of real school photos, with a lightbox. */
export default async function Moments() {
  const photos = (await getPublicPhotos()).slice(0, 8);
  if (photos.length < 4) return null;
  return (
    <section className="bg-ivory" aria-labelledby="moments-heading">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-24 lg:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">School Moments</p>
          <h2 id="moments-heading" className="display mt-3 text-3xl sm:text-4xl lg:text-5xl">Moments that <span className="mark">matter</span></h2>
        </Reveal>
        <Reveal delay={100} className="mt-12 lg:mt-16">
          <PhotoMasonry photos={photos.map((p) => ({ src: p.src, alt: p.alt || p.category }))} />
        </Reveal>
        <Reveal delay={200} className="mt-10 text-center">
          <ButtonLink href="/gallery" variant="outline">View Full Gallery <ArrowRight className="h-4 w-4" /></ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
