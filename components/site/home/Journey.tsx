import Reveal from "@/components/ui/Reveal";
import { SectionHead } from "@/components/site/Section";
import { journey } from "@/lib/content";

export default function Journey() {
  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-20 lg:py-28">
        <SectionHead
          eyebrow="The Learning Journey"
          title={<>How a STEAM student <span className="mark">grows</span></>}
          lead="Every project at our school moves through the same five moments — a real sequence students learn to trust."
        />
        {/* Desktop: horizontal storyline · Mobile: vertical timeline */}
        <ol className="relative mt-14 grid gap-10 md:grid-cols-5 md:gap-6">
          <div aria-hidden className="absolute left-[11px] top-2 h-[calc(100%-1rem)] w-px bg-mist md:left-0 md:top-[11px] md:h-px md:w-full" />
          {journey.map((j, i) => (
            <Reveal key={j.step} delay={i * 90}>
              <li className="relative pl-10 md:pl-0 md:pt-10">
                <span aria-hidden className="absolute left-0 top-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-teal-600 bg-ivory md:left-0 md:top-0">
                  <span className="h-2 w-2 rounded-full bg-teal-600" />
                </span>
                <span className="text-xs font-bold tracking-widest text-teal-700">{j.step}</span>
                <h3 className="mt-1 text-xl font-semibold text-ink">{j.name}</h3>
                <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-slate2">{j.line}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
