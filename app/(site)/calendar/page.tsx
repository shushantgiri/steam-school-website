import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/Section";
import SchoolCalendar from "@/components/site/SchoolCalendar";
import { getCalendarEvents } from "@/lib/data";
import { todayIso } from "@/lib/format";

export const metadata: Metadata = { title: "School Calendar" };

export default async function CalendarPage() {
  const events = await getCalendarEvents();
  const today = todayIso();
  // Open on the next month that has something in it.
  const initialMonth = (events.find((e) => e.date >= today) ?? events[events.length - 1])?.date.slice(0, 7);

  return (
    <>
      <PageHero
        eyebrow="School Calendar"
        title={<>Plan the <span className="mark">year</span></>}
        lead="Exams, holidays, events, programs and meetings — tap any date to see what's on."
      />
      <Section>
        <SchoolCalendar events={events} initialMonth={initialMonth} />
      </Section>
    </>
  );
}
