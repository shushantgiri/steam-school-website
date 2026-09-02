import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { SectionHead } from "@/components/site/Section";
import { steam } from "@/lib/content";

export default function WhySteam() {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-20 lg:py-28">
        <SectionHead
          dark
          eyebrow="Why STEAM"
          title={<>Where Curiosity Becomes <span className="mark">Creation</span></>}
          lead="Five disciplines, taught as one connected way of thinking."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl2 border border-white/10 bg-white/10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-5">
          {steam.map((s, i) => (
            <Reveal key={s.key} delay={i * 70} className="group relative flex min-h-[300px] flex-col justify-end overflow-hidden bg-ink sm:min-h-[340px] lg:min-h-[420px]">
              <Image
                src={s.image}
                alt={`${s.name} at The School of STEAM Education`}
                fill
                sizes="(min-width:1024px) 20vw, (min-width:640px) 50vw, 100vw"
                className="object-cover opacity-45 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-60 motion-reduce:transition-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
              <div className="relative p-6">
                <span className="text-4xl font-bold text-teal-200">{s.key}</span>
                <h3 className="mt-2 text-lg font-semibold">{s.name}</h3>
                <p className="mt-1 text-sm text-white/70">{s.line}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
