import Reveal from "@/components/ui/Reveal";
import { Atom, HeartHandshake, Wrench, Sprout } from "lucide-react";

const items = [
  { icon: Atom, title: "STEAM Learning", line: "Science · Technology · Engineering · Arts · Mathematics" },
  { icon: HeartHandshake, title: "Student-Centered", line: "Learning built around curiosity and growth." },
  { icon: Wrench, title: "Practical Learning", line: "Ideas become projects and experiences." },
  { icon: Sprout, title: "Holistic Development", line: "Academic, creative and personal growth." },
];

export default function Highlights() {
  return (
    <section className="border-y border-mist bg-ivory">
      <div className="mx-auto grid max-w-shell gap-px overflow-hidden px-5 py-4 sm:px-8 md:grid-cols-2 xl:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.title} delay={i * 80} className="flex gap-4 border-mist p-6 md:p-8 xl:border-l xl:first:border-l-0">
            <it.icon className="mt-1 h-5 w-5 shrink-0 text-teal-600" strokeWidth={1.75} aria-hidden />
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate2">{it.line}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
