import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getHomepage, withMark } from "@/lib/homepage";

export default async function CTA() {
  const { cta } = await getHomepage();
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto max-w-shell px-5 py-20 text-center sm:px-8 sm:py-28">
        <Reveal>
          <p className="eyebrow justify-center !text-teal-200">{cta.eyebrow}</p>
          <h2 className="display mx-auto mt-5 max-w-2xl text-3xl !text-white sm:text-5xl">
            {withMark(cta.heading, cta.markWord).map((p, i) =>
              p.mark ? <span key={i} className="mark">{p.text}</span> : <span key={i}>{p.text}</span>
            )}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/70 sm:text-lg">{cta.description}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={cta.primaryHref} size="lg">{cta.primaryLabel}</ButtonLink>
            <ButtonLink href={cta.secondaryHref} variant="light" size="lg">{cta.secondaryLabel}</ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
