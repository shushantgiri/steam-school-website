import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getHomepage } from "@/lib/homepage";
import { img } from "@/lib/images";

/** Final call-to-action: Learn. Create. Grow. — over a school photo. */
export default async function FinalCTA() {
  const { cta, about } = await getHomepage();
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <div className="relative isolate overflow-hidden rounded-xl2 bg-ink text-white">
          <Image src={about.image || img.campus} alt="" fill sizes="100vw" className="-z-20 object-cover opacity-40" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
          <Reveal className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12 lg:p-16">
            <div>
              <h2 className="display text-3xl !text-white sm:text-4xl">A place to learn, create &amp; <span className="mark">grow</span>.</h2>
              <p className="mt-3 max-w-lg text-white/80">{cta.description || "Join a school community where every student is encouraged to explore their potential."}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              <ButtonLink href={cta.primaryHref || "/admissions"} size="lg" className="whitespace-nowrap">Explore Admissions <ArrowRight className="h-4 w-4 shrink-0" /></ButtonLink>
              <ButtonLink href={cta.secondaryHref || "/contact"} variant="light" size="lg" className="whitespace-nowrap !border-white/30 !bg-transparent !text-white hover:!bg-white/10">Contact Us <ArrowRight className="h-4 w-4 shrink-0" /></ButtonLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
