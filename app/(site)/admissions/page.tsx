import type { Metadata } from "next";
import Image from "next/image";
import { PageHero, Section, SectionHead } from "@/components/site/Section";
import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { admissions } from "@/lib/content";
import { img } from "@/lib/images";
import { getSiteImageOverrides, resolveSiteImage } from "@/lib/site-images";
import { FileText, CalendarDays, BadgeCheck, Wallet } from "lucide-react";

export const metadata: Metadata = { title: "Admissions" };

export default async function AdmissionsPage() {
  const chosen = await getSiteImageOverrides();
  const admissionsPhoto = resolveSiteImage(chosen, "admissions-photo", img.earlyEd);
  return (
    <>
      <PageHero
        eyebrow="Admissions · Academic Year 2083"
        title={<>Start Your <span className="mark">Journey</span></>}
        lead="Joining The School of STEAM Education is simple, friendly and transparent. Here is exactly how it works."
      />
      <Section>
        <SectionHead eyebrow="The Admission Process" title="Five steps, no surprises" />
        <ol className="relative mt-14 grid gap-10 md:grid-cols-5 md:gap-6">
          <div aria-hidden className="absolute left-[11px] top-2 h-[calc(100%-1rem)] w-px bg-mist md:left-0 md:top-[11px] md:h-px md:w-full" />
          {admissions.steps.map((s, i) => (
            <Reveal key={s.step} delay={i * 80}>
              <li className="relative pl-10 md:pl-0 md:pt-10">
                <span aria-hidden className="absolute left-0 top-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-teal-600 bg-paper md:left-0 md:top-0">
                  <span className="h-2 w-2 rounded-full bg-teal-600" />
                </span>
                <span className="text-xs font-bold tracking-widest text-teal-700">{s.step}</span>
                <h3 className="mt-1 text-lg font-semibold text-ink">{s.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate2">{s.line}</p>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mt-12">
          <ButtonLink href="/admissions/apply" size="lg">Start Your Application</ButtonLink>
        </Reveal>
      </Section>

      <Section tone="ivory">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="rounded-xl2 border border-mist bg-white p-7 shadow-soft sm:p-8">
            <div className="flex items-center gap-3"><BadgeCheck className="h-5 w-5 text-teal-600" /><h2 className="text-xl font-semibold text-ink">Eligibility</h2></div>
            <ul className="mt-4 space-y-3">
              {admissions.eligibility.map((e) => (
                <li key={e} className="flex gap-3 text-sm leading-relaxed text-slate2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />{e}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={80} className="rounded-xl2 border border-mist bg-white p-7 shadow-soft sm:p-8">
            <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-teal-600" /><h2 className="text-xl font-semibold text-ink">Required Documents</h2></div>
            <ul className="mt-4 space-y-3">
              {admissions.documents.map((d) => (
                <li key={d} className="flex gap-3 text-sm leading-relaxed text-slate2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />{d}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120} className="rounded-xl2 border border-mist bg-white p-7 shadow-soft sm:p-8">
            <div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-teal-600" /><h2 className="text-xl font-semibold text-ink">Important Dates</h2></div>
            <dl className="mt-4 divide-y divide-mist">
              {admissions.dates.map((d) => (
                <div key={d.label} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-sm text-slate2">{d.label}</dt>
                  <dd className="text-right text-sm font-medium text-ink">{d.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={160} className="rounded-xl2 border border-mist bg-white p-7 shadow-soft sm:p-8">
            <div className="flex items-center gap-3"><Wallet className="h-5 w-5 text-teal-600" /><h2 className="text-xl font-semibold text-ink">Fee Information</h2></div>
            <p className="mt-4 text-sm leading-relaxed text-slate2">{admissions.fees}</p>
          </Reveal>
        </div>
      </Section>

      <Section id="faqs">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <SectionHead eyebrow="FAQs" title={<>Questions families <span className="mark">ask</span></>} />
            <Reveal className="img-zoom relative mt-8 hidden aspect-[4/5] overflow-hidden rounded-xl2 lg:block">
              <Image src={admissionsPhoto} alt="A young student on their first days at school" fill sizes="40vw" className="object-cover" />
            </Reveal>
          </div>
          <div className="space-y-3">
            {admissions.faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <details className="group rounded-xl2 border border-mist bg-white shadow-soft open:shadow-lift">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium text-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="text-xl text-teal-600 transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate2">{f.a}</p>
                </details>
              </Reveal>
            ))}
            <Reveal delay={320} className="pt-4">
              <ButtonLink href="/admissions/apply" size="lg">Start Your Application</ButtonLink>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
