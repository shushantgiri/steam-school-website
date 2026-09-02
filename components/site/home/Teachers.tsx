import Image from "next/image";
import { ArrowRight, User } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getPublishedStaff } from "@/lib/staff";

/** Teachers — a clean preview of 4–6 featured educators; the full directory lives on /teachers. */
export default async function Teachers() {
  const staff = (await getPublishedStaff()).filter((m) => m.featured).slice(0, 6);
  if (staff.length === 0) return null;
  return (
    <section className="bg-ivory" aria-labelledby="teachers-heading">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-24 lg:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">Teachers</p>
          <h2 id="teachers-heading" className="display mt-3 text-3xl sm:text-4xl lg:text-5xl">Meet the people behind the <span className="mark">learning</span></h2>
          <p className="mt-4 text-base text-charcoal sm:text-lg">Dedicated educators who guide, inspire and support every student.</p>
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:mt-16 lg:grid-cols-6 lg:gap-5">
          {staff.map((m, i) => (
            <Reveal key={m.id} delay={i * 60}>
              <article className="text-center">
                <div className="relative mx-auto aspect-[4/5] overflow-hidden rounded-xl2 bg-white shadow-soft">
                  {m.photo ? (
                    <Image src={m.photo} alt={m.name} fill sizes="(min-width:1024px) 15vw, (min-width:640px) 30vw, 45vw" className="object-cover object-top" />
                  ) : (
                    <div className="grid h-full place-items-center text-slate2"><User className="h-8 w-8" /></div>
                  )}
                </div>
                <h3 className="mt-3 line-clamp-1 text-sm font-semibold text-ink sm:text-base">{m.name}</h3>
                <p className="line-clamp-1 text-xs text-teal-700 sm:text-sm">{m.designation}</p>
                {m.subjects && <p className="line-clamp-1 text-[11px] text-slate2 sm:text-xs">{m.subjects}</p>}
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal delay={300} className="mt-12 text-center">
          <ButtonLink href="/teachers" variant="dark">Meet All Teachers &amp; Staff <ArrowRight className="h-4 w-4" /></ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
