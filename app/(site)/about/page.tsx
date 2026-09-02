import type { Metadata } from "next";
import Image from "next/image";
import { Compass, Target, Heart, Lightbulb, Shield, Award, Quote, ArrowRight, User } from "lucide-react";
import { PageHero, Section } from "@/components/site/Section";
import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getAbout } from "@/lib/about";
import { getHomepage, withMark } from "@/lib/homepage";
import { getSettings } from "@/lib/data";
import { img } from "@/lib/images";

export const metadata: Metadata = { title: "About Us" };

const VALUE_ICONS = [Lightbulb, Heart, Shield, Award, Compass, Target];

/**
 * About Us — the school profile. Every word and photo is editable in
 * Admin → About Page. Teachers have their own page (/teachers) so this one
 * stays focused on the school itself.
 */
export default async function AboutPage() {
  const [about, { about: home }, settings] = await Promise.all([getAbout(), getHomepage(), getSettings()]);
  const introImg = about.intro.image || home.image || img.about;
  const philosophyImg = about.philosophy.image || img.lab;
  const principalName = about.principal.name || settings.principalName || "";
  const heading = withMark(about.intro.heading, about.intro.markWord);

  return (
    <>
      <PageHero
        eyebrow="About Us"
        title={<>Who we <span className="mark">are</span></>}
        lead={`${settings.name}, ${settings.location} — a place where children learn by doing, guided by teachers who know them well.`}
      />

      {/* Introduction */}
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow">{about.intro.eyebrow}</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              {heading.map((p, i) => (p.mark ? <span key={i} className="mark">{p.text}</span> : <span key={i}>{p.text}</span>))}
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-charcoal">
              {about.intro.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/admissions">Admissions</ButtonLink>
              <ButtonLink href="/teachers" variant="outline">Meet our teachers</ButtonLink>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <figure>
              <div className="img-zoom relative aspect-[4/3] overflow-hidden rounded-xl2 shadow-lift">
                <Image src={introImg} alt={about.intro.imageCaption} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
              </div>
              {about.intro.imageCaption && <figcaption className="mt-3 text-center text-sm text-slate2">{about.intro.imageCaption}</figcaption>}
            </figure>
          </Reveal>
        </div>
      </Section>

      {/* Vision & Mission */}
      <Section tone="ink">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { icon: Compass, label: "Our Vision", text: about.vision },
            { icon: Target, label: "Our Mission", text: about.mission },
          ].map(({ icon: Icon, label, text }, i) => (
            <Reveal key={label} delay={i * 100}>
              <div className="h-full rounded-xl2 border border-white/10 bg-white/[0.06] p-8">
                <span className="inline-grid h-12 w-12 place-items-center rounded-full bg-teal-700 text-white"><Icon className="h-5 w-5" /></span>
                <h2 className="mt-5 text-xl font-semibold text-white">{label}</h2>
                <p className="mt-3 text-base leading-relaxed text-white/80">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Philosophy */}
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <div className="img-zoom relative aspect-[4/3] overflow-hidden rounded-xl2 shadow-soft">
              <Image src={philosophyImg} alt="Students learning by doing" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </div>
          </Reveal>
          <Reveal delay={100} className="order-1 lg:order-2">
            <p className="eyebrow">Educational Philosophy</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">{about.philosophy.heading}</h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-charcoal">
              {about.philosophy.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Values */}
      <Section tone="ivory">
        <div className="max-w-2xl">
          <p className="eyebrow">Our Values</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">What we <span className="mark">stand for</span></h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {about.values.map((v, i) => {
            const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
            return (
              <Reveal key={v.title + i} delay={i * 70}>
                <div className="h-full rounded-xl2 border border-mist bg-white p-6 transition hover:-translate-y-1 hover:shadow-lift">
                  <span className="inline-grid h-11 w-11 place-items-center rounded-full bg-teal-50 text-teal-700"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal">{v.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* Principal's message */}
      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
          <Reveal>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-xl2 bg-ivory shadow-lift">
              {about.principal.photo ? (
                <Image src={about.principal.photo} alt={principalName || "The Principal"} fill sizes="(min-width:1024px) 30vw, 80vw" className="object-cover object-top" />
              ) : (
                <div className="grid h-full place-items-center text-slate2"><User className="h-16 w-16" /></div>
              )}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <p className="eyebrow">A Message from the {about.principal.designation}</p>
            <Quote className="mt-5 h-8 w-8 text-teal-700/40" aria-hidden />
            <div className="mt-3 space-y-4 text-lg leading-relaxed text-charcoal">
              {about.principal.message.map((t, i) => <p key={i}>{t}</p>)}
            </div>
            <div className="mt-6 border-t border-mist pt-5">
              <p className="font-semibold text-ink">{principalName || settings.name}</p>
              <p className="text-sm text-slate2">{about.principal.designation}, {settings.name}</p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* History */}
      <Section tone="ivory">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow">Our History</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">{about.history.heading}</h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-charcoal">
              {about.history.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            </div>
          </Reveal>
          <Reveal delay={100}>
            <ol className="relative space-y-6 border-l-2 border-teal-700/30 pl-6">
              {about.history.milestones.map((m, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-teal-700" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">{m.year}</p>
                  <p className="mt-1 text-base text-charcoal">{m.text}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </Section>

      {/* What makes us different */}
      <Section>
        <div className="max-w-2xl">
          <p className="eyebrow">Why Families Choose Us</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">What makes the school <span className="mark">different</span></h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {about.different.map((d, i) => (
            <Reveal key={d.title + i} delay={i * 70}>
              <div className="flex h-full gap-4 rounded-xl2 border border-mist bg-white p-6">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">{d.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal">{d.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Teachers hand-off + CTA */}
      <Section tone="ink">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow !text-teal-200">Our People</p>
            <h2 className="display mt-3 text-2xl !text-white sm:text-3xl">Meet the teachers who make it all happen</h2>
            <p className="mt-2 max-w-xl text-white/75">Every teacher, with photo, subject and a short introduction.</p>
          </div>
          <ButtonLink href="/teachers" variant="outline" className="!border-white/40 !text-white hover:!bg-white/10">
            Teachers &amp; Staff <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
