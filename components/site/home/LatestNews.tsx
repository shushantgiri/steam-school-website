import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bell, CalendarDays, Clock, MapPin } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getEventsPage, getPublicPosts } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { img } from "@/lib/images";
import type { Post } from "@/lib/types";

/**
 * "Latest from the School" — an editorial, image-led news area:
 *   FeaturedNews   1 large story + 2 smaller stories beside it
 *   SchoolUpdates  a 3-card image grid of the next stories
 *   ImportantNotices  a compact highlighted strip (important first)
 *   UpcomingEvents  clean event cards with date tiles
 * Every image uses a fixed aspect ratio and object-cover, with a
 * professional fallback when a story has no photo, so cards never differ in
 * height and nothing stretches. Sections render nothing when empty.
 */

const FALLBACKS = [img.classroom, img.lab, img.sports, img.artRoom, img.event, img.library];
const photoFor = (p: Post, i: number) => p.image || FALLBACKS[i % FALLBACKS.length];

const dateTile = (iso: string) => {
  const d = new Date(iso + "T00:00:00Z");
  return Number.isNaN(d.getTime())
    ? { day: "—", mon: "" }
    : { day: d.toLocaleDateString("en", { day: "2-digit", timeZone: "UTC" }), mon: d.toLocaleDateString("en", { month: "short", timeZone: "UTC" }) };
};

async function newsPosts() {
  const posts = await getPublicPosts();
  const news = posts.filter((p) => p.category === "News");
  // If the school has few news stories, let notices with images fill the grid.
  return news.length >= 3 ? news : [...news, ...posts.filter((p) => p.category !== "News" && p.category !== "Event")];
}

/* ---------------------------- Featured news ---------------------------- */
export async function FeaturedNews() {
  const posts = await newsPosts();
  const [lead, ...rest] = posts;
  if (!lead) return null;
  const side = rest.slice(0, 2);

  return (
    <section className="bg-paper" aria-labelledby="latest-heading">
      <div className="mx-auto max-w-shell px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16 lg:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">News</p>
            <h2 id="latest-heading" className="display mt-2 text-3xl sm:text-4xl">Latest from the <span className="mark">school</span></h2>
          </div>
          <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline">All news <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-5">
          <Reveal className="lg:col-span-2">
            <Link href={`/news/${lead.slug}`} className="group block overflow-hidden rounded-xl2 border border-mist bg-white shadow-soft transition hover:shadow-lift">
              <div className="relative aspect-[16/9]">
                <Image src={photoFor(lead, 0)} alt="" fill priority sizes="(min-width:1024px) 66vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
                  <p className="text-xs font-medium text-white/80">
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 backdrop-blur">{lead.category}</span>
                    <span className="ml-2">{formatDate(lead.date)}</span>
                  </p>
                  <h3 className="mt-2 max-w-2xl text-xl font-semibold leading-snug sm:text-2xl lg:text-3xl">{lead.title}</h3>
                  <p className="mt-2 hidden max-w-xl text-sm text-white/85 sm:line-clamp-2">{lead.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">Read more <ArrowRight className="h-4 w-4" /></span>
                </div>
              </div>
            </Link>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5">
            {side.map((p, i) => (
              <Reveal key={p.slug} delay={80 + i * 80}>
                <Link href={`/news/${p.slug}`} className="group flex h-full overflow-hidden rounded-xl2 border border-mist bg-white shadow-soft transition hover:shadow-lift lg:flex-col">
                  <div className="relative w-2/5 shrink-0 lg:aspect-[16/10] lg:w-full">
                    <Image src={photoFor(p, i + 1)} alt="" fill sizes="(min-width:1024px) 33vw, 40vw" className="object-cover" />
                  </div>
                  <div className="flex flex-col justify-center p-4">
                    <p className="text-[11px] font-medium text-slate2">{p.category} · {formatDate(p.date)}</p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-teal-700 sm:text-base">{p.title}</h3>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- School updates --------------------------- */
export async function SchoolUpdates() {
  const posts = (await newsPosts()).slice(3, 6);
  if (posts.length === 0) return null;
  return (
    <section className="bg-paper" aria-labelledby="updates-heading">
      <div className="mx-auto max-w-shell px-5 pb-12 sm:px-8 sm:pb-16">
        <h2 id="updates-heading" className="text-sm font-bold uppercase tracking-[0.18em] text-slate2">More News</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <Reveal key={p.slug} delay={i * 70}>
              <Link href={`/news/${p.slug}`} className="group block h-full overflow-hidden rounded-xl2 border border-mist bg-white transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="relative aspect-[16/10]">
                  <Image src={photoFor(p, i + 3)} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-medium text-slate2">{p.category} · {formatDate(p.date)}</p>
                  <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-ink group-hover:text-teal-700">{p.title}</h3>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Important notices ------------------------- */
export async function ImportantNotices() {
  const notices = (await getPublicPosts())
    .filter((p) => p.category !== "News" && p.category !== "Event")
    .sort((a, b) => Number(!!b.important) - Number(!!a.important) || b.date.localeCompare(a.date))
    .slice(0, 4);
  if (notices.length === 0) return null;
  return (
    <section className="bg-paper" aria-labelledby="notices-heading">
      <div className="mx-auto max-w-shell px-5 py-6 sm:px-8 sm:py-8">
        <Reveal>
          <div className="rounded-xl2 border border-teal-700/20 bg-teal-50/60 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="notices-heading" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-teal-800">
                <Bell className="h-4 w-4" /> Important Notices
              </h2>
              <Link href="/news#notices" className="text-sm font-medium text-teal-700 hover:underline">All notices →</Link>
            </div>
            <ul className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
              {notices.map((n) => (
                <li key={n.slug}>
                  <Link href={`/news/${n.slug}`} className="group flex items-baseline gap-3 py-2">
                    <time dateTime={n.date} className="w-16 shrink-0 text-xs font-medium text-slate2">{formatDate(n.date).replace(/,? \d{4}$/, "")}</time>
                    <span className="line-clamp-1 text-sm font-medium text-ink group-hover:text-teal-700">
                      {n.important && <span className="mr-2 rounded-full bg-red-600 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase text-white">Important</span>}
                      {n.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------- Upcoming events -------------------------- */
export async function UpcomingEvents() {
  const { upcoming } = await getEventsPage();
  const events = upcoming.slice(0, 3);
  if (events.length === 0) return null;
  return (
    <section className="bg-paper" aria-labelledby="events-heading">
      <div className="mx-auto max-w-shell px-5 py-6 pb-12 sm:px-8 sm:pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="events-heading" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate2">
            <CalendarDays className="h-4 w-4" /> Upcoming Events
          </h2>
          <Link href="/events" className="text-sm font-medium text-teal-700 hover:underline">All events →</Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {events.map((e, i) => {
            const d = dateTile(e.date);
            return (
              <Reveal key={e.id} delay={i * 70}>
                <Link href="/events" className="group flex h-full gap-4 rounded-xl2 border border-mist bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="w-14 shrink-0 rounded-lg bg-ink py-2 text-center text-white">
                    <div className="text-xl font-bold leading-none">{d.day}</div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-teal-200">{d.mon}</div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 font-semibold leading-snug text-ink group-hover:text-teal-700">{e.title}</h3>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate2">
                      {e.time && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {e.time}</span>}
                      {e.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>}
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
        <div className="mt-6 sm:hidden"><ButtonLink href="/news" variant="outline" className="w-full">All news &amp; notices</ButtonLink></div>
      </div>
    </section>
  );
}

/* ---------------------- Notices + events, one row ---------------------- */
export async function NoticesAndEvents() {
  const [posts, { upcoming }] = await Promise.all([getPublicPosts(), getEventsPage()]);
  const notices = posts
    .filter((p) => p.category !== "News" && p.category !== "Event")
    .sort((a, b) => Number(!!b.important) - Number(!!a.important) || b.date.localeCompare(a.date))
    .slice(0, 4);
  const events = upcoming.slice(0, 3);
  if (notices.length === 0 && events.length === 0) return null;

  const label = (p: Post) => (p.important ? "Important" : p.category === "Notice" ? "General" : p.category);
  const badge = (p: Post) =>
    p.important ? "bg-red-50 text-red-700 ring-red-100"
    : p.category === "Exam" ? "bg-teal-50 text-teal-800 ring-teal-100"
    : p.category === "Holiday" ? "bg-amber-50 text-amber-800 ring-amber-100"
    : "bg-ivory text-charcoal ring-mist";

  return (
    <section className="bg-white" aria-label="Important notices and upcoming events">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-8">
          {/* Notices — light panel */}
          {notices.length > 0 && (
            <Reveal className="flex">
              <div className="flex w-full flex-col overflow-hidden rounded-xl2 border border-mist bg-white shadow-soft">
                <div className="flex items-start justify-between gap-4 border-b border-mist px-5 py-5 sm:px-6">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700"><Bell className="h-5 w-5" /></span>
                    <div>
                      <h2 className="text-lg font-semibold text-ink sm:text-xl">Important Notices</h2>
                      <p className="mt-0.5 text-sm text-charcoal">Stay updated with important school announcements.</p>
                    </div>
                  </div>
                </div>
                <ul className="flex-1">
                  {notices.map((n, i) => {
                    const d = dateTile(n.date);
                    return (
                      <li key={n.slug} className={i > 0 ? "border-t border-mist" : ""}>
                        <Link href={`/news/${n.slug}`} className="group flex items-center gap-4 px-5 py-3.5 transition hover:bg-teal-50/40 sm:px-6">
                          <div className={`w-12 shrink-0 rounded-lg py-1.5 text-center transition ${n.important ? "bg-red-50 text-red-700" : "bg-ivory text-ink group-hover:bg-teal-50"}`}>
                            <div className="text-lg font-bold leading-none">{d.day}</div>
                            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-70">{d.mon}</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-teal-700 sm:text-[15px]">{n.title}</p>
                            <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${badge(n)}`}>{label(n)}</span>
                          </div>
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ivory text-slate2 transition group-hover:bg-teal-700 group-hover:text-white"><ArrowRight className="h-4 w-4" /></span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-mist px-5 py-4 sm:px-6">
                  <Link href="/news#notices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline">View All Notices <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
            </Reveal>
          )}

          {/* Events — dark panel */}
          {events.length > 0 && (
            <Reveal delay={120} className="flex">
              <div className="flex w-full flex-col overflow-hidden rounded-xl2 border border-mist bg-white shadow-soft">
                <div className="flex items-start gap-3 border-b border-mist px-5 py-5 sm:px-6">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700"><CalendarDays className="h-5 w-5" /></span>
                  <div>
                    <h2 className="text-lg font-semibold text-ink sm:text-xl">Upcoming Events</h2>
                    <p className="mt-0.5 text-sm text-charcoal">Mark your calendar.</p>
                  </div>
                </div>
                <ul className="flex-1 divide-y divide-mist">
                  {events.map((e, i) => {
                    const d = dateTile(e.date);
                    return (
                      <li key={e.id}>
                        <Link href="/events" className="group flex items-center gap-4 px-5 py-4 transition hover:bg-teal-50/40 sm:px-6">
                          <div className={`w-14 shrink-0 rounded-lg py-2 text-center ${i === 0 ? "bg-teal-700 text-white" : "bg-ivory text-ink"}`}>
                            <div className="text-xl font-bold leading-none">{d.day}</div>
                            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-70">{d.mon}</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-teal-700 sm:text-[15px]">{e.title}</h3>
                            {(e.location || e.time) && (
                              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate2">
                                {e.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>}
                                {e.location && e.time && <span aria-hidden>·</span>}
                                {e.time && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {e.time}</span>}
                              </p>
                            )}
                          </div>
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ivory text-slate2 transition group-hover:bg-teal-700 group-hover:text-white"><ArrowRight className="h-4 w-4" /></span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-mist px-5 py-4 sm:px-6">
                  <Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline">View All Events <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
