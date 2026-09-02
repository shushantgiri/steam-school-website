import { SectionHead } from "@/components/site/Section";
import { getPublishedTestimonials } from "@/lib/testimonials";
import TestimonialCarousel from "./TestimonialCarousel";

/** "Families Who Trust Us" — straight from the CMS; hidden entirely when empty. */
export default async function Testimonials() {
  const all = await getPublishedTestimonials();
  if (all.length === 0) return null;
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-24">
        <SectionHead
          eyebrow="Families Who Trust Us"
          title={<>Real experiences from our <span className="mark">school</span> community</>}
        />
        <TestimonialCarousel items={all.map(({ id, name, role, quote }) => ({ id, name, role, quote }))} />
      </div>
    </section>
  );
}
