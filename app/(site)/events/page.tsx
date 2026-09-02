import Image from "next/image";
import type { Metadata } from "next";
import { CalendarDays, Clock, MapPin, CalendarX2 } from "lucide-react";
import { PageHero, Section, SectionHead } from "@/components/site/Section";
import Reveal from "@/components/ui/Reveal";
import { getEventsPage } from "@/lib/data";
import { formatLongDate } from "@/lib/format";
import { img } from "@/lib/images";
import type { EventItem } from "@/lib/types";

export const metadata: Metadata = { title: "Events" };

/** Events added without a photo still need something to show. */
const cover = (e: EventItem) => e.image || img.campus;

function Meta({ date, time, location }: { date: string; time?: string; location?: string }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate2">
      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden />{date}</span>
      {time && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden />{time}</span>}
      {location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden />{location}</span>}
    </div>
  );
}

function Empty({ line }: { line: string }) {
  return (
    <div className="mt-10 grid place-items-center rounded-xl2 border border-dashed border-mist bg-white py-16 text-center">
      <CalendarX2 className="h-8 w-8 text-slate2" aria-hidden />
      <p className="mt-3 font-medium text-ink">{line}</p>
      <p className="mt-1 text-sm text-slate2">Check the school calendar for the full year.</p>
    </div>
  );
}

export default async function EventsPage() {
  const { featured, upcoming, past } = await getEventsPage();

  return (
    <>
      <PageHero eyebrow="Events" title={<>Days worth <span className="mark">circling</span></>} lead="Fairs, meetings, matches and tours — everything happening at school and beyond." />
      <Section>
        <SectionHead eyebrow="Upcoming Events" title="Coming up next" />
        {featured ? (
          <Reveal className="mt-10 grid overflow-hidden rounded-xl2 border border-mist bg-white shadow-soft lg:grid-cols-2">
            <div className="img-zoom relative min-h-[260px] overflow-hidden sm:min-h-[360px]">
              <Image src={cover(featured)} alt={featured.title} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <span className="w-fit rounded-full bg-sun-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">Featured Event</span>
              <h2 className="display mt-4 text-2xl sm:text-3xl">{featured.title}</h2>
              <Meta date={formatLongDate(featured.date, true)} time={featured.time} location={featured.location} />
              <p className="mt-4 leading-relaxed text-slate2">{featured.description}</p>
            </div>
          </Reveal>
        ) : (
          <Empty line="Nothing scheduled just yet" />
        )}
        {upcoming.length > 0 && (
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {upcoming.map((e, i) => (
              <Reveal key={e.id} delay={i * 70} className="overflow-hidden rounded-xl2 border border-mist bg-white shadow-soft">
                <div className="img-zoom relative aspect-[16/10] overflow-hidden">
                  <Image src={cover(e)} alt={e.title} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-ink">{e.title}</h3>
                  <Meta date={formatLongDate(e.date)} time={e.time} location={e.location} />
                  <p className="mt-3 text-sm leading-relaxed text-slate2">{e.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </Section>
      <Section tone="ivory">
        <SectionHead eyebrow="Past Events" title="Recently on campus" />
        {past.length === 0 ? (
          <Empty line="No past events to show yet" />
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {past.map((e, i) => (
              <Reveal key={e.id} delay={i * 70} className="overflow-hidden rounded-xl2 border border-mist bg-white shadow-soft">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={cover(e)} alt={e.title} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover grayscale-[25%]" />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-ink">{e.title}</h3>
                  <Meta date={formatLongDate(e.date)} location={e.location} />
                  <p className="mt-3 text-sm leading-relaxed text-slate2">{e.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
