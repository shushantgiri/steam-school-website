import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bell, CalendarDays, MapPin, Paperclip } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getEventsPage, getPublicPosts } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { img } from "@/lib/images";

/**
 * News & Notices — the first section after the hero, because it is what
 * families visit the site for. Three columns on desktop: the latest news
 * story as a photo card, a notice board with dates, and upcoming events.
 */
export default async function NewsBoard() {
  const [posts, events] = await Promise.all([getPublicPosts(), getEventsPage()]);
  const news = posts.filter((p) => p.category === "News");
  const notices = posts.filter((p) => p.category !== "News" && p.category !== "Event").slice(0, 5);
  const featured = news[0] ?? posts[0];
  const upcoming = events.upcoming.slice(0, 3);
  if (!featured && notices.length === 0 && upcoming.length === 0) return null;

  const dateParts = (iso: string) => {
    const d = new Date(iso + "T00:00:00Z");
    return Number.isNaN(d.getTime())
      ? { day: "—", mon: "" }
      : { day: d.toLocaleDateString("en", { day: "2-digit", timeZone: "UTC" }), mon: d.toLocaleDateString("en", { month: "short", timeZone: "UTC" }) };
  };

  return (
    <section className="bg-paper" aria-labelledby="news-heading">
      <div className="mx-auto max-w-shell px-5 py-14 sm:px-8 sm:py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">News &amp; Notices</p>
            <h2 id="news-heading" className="display mt-3 text-3xl sm:text-4xl">Latest from the <span className="mark">school</span></h2>
          </div>
          <ButtonLink href="/news" variant="outline">All news &amp; notices</ButtonLink>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* Featured story */}
          {featured && (
            <Reveal className="lg:col-span-5">
              <Link href={`/news/${featured.slug}`} className="group block h-full overflow-hidden rounded-xl2 border border-mist bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
                <div className="img-zoom relative aspect-[16/10]">
                  <Image src={featured.image || img.about} alt="" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal-700">{featured.category}</span>
                </div>
                <div className="p-6">
                  <time dateTime={featured.date} className="text-xs font-medium text-slate2">{formatDate(featured.date)}</time>
                  <h3 className="mt-2 text-xl font-semibold leading-snug text-ink transition-colors group-hover:text-teal-700">{featured.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-charcoal">{featured.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-700">Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </Reveal>
          )}

          {/* Notice board */}
          <Reveal delay={80} className="lg:col-span-4">
            <div className="flex h-full flex-col rounded-xl2 border border-mist bg-white shadow-soft">
              <div className="flex items-center gap-2 border-b border-mist px-5 py-4">
                <Bell className="h-4 w-4 text-teal-700" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">Notice Board</h3>
              </div>
              {notices.length === 0 ? (
                <p className="p-5 text-sm text-slate2">No current notices.</p>
              ) : (
                <ul className="flex-1 divide-y divide-mist">
                  {notices.map((n) => {
                    const d = dateParts(n.date);
                    return (
                      <li key={n.slug}>
                        <Link href={`/news/${n.slug}`} className="group flex gap-4 px-5 py-3.5 transition hover:bg-ivory">
                          <div className="w-11 shrink-0 rounded-lg border border-mist bg-paper text-center">
                            <div className="text-lg font-bold leading-tight text-ink">{d.day}</div>
                            <div className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate2">{d.mon}</div>
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-teal-700">{n.title}</p>
                            <p className="mt-0.5 flex items-center gap-2 text-xs text-slate2">
                              {n.category}{n.important && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">Important</span>}
                              {n.attachment && <Paperclip className="h-3 w-3" aria-label="Has attachment" />}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link href="/news#notices" className="border-t border-mist px-5 py-3 text-sm font-medium text-teal-700 hover:underline">All notices →</Link>
            </div>
          </Reveal>

          {/* Upcoming events */}
          <Reveal delay={160} className="lg:col-span-3">
            <div className="flex h-full flex-col rounded-xl2 bg-ink text-white shadow-soft">
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
                <CalendarDays className="h-4 w-4 text-teal-200" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Upcoming Events</h3>
              </div>
              {upcoming.length === 0 ? (
                <p className="p-5 text-sm text-white/70">No upcoming events yet.</p>
              ) : (
                <ul className="flex-1 divide-y divide-white/10">
                  {upcoming.map((e) => {
                    const d = dateParts(e.date);
                    return (
                      <li key={e.id} className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-white/10 px-2.5 py-1.5 text-center">
                            <div className="text-base font-bold leading-tight">{d.day}</div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-200">{d.mon}</div>
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-medium leading-snug">{e.title}</p>
                            {(e.time || e.location) && (
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
                                {e.location && <><MapPin className="h-3 w-3" /> {e.location}</>}{e.time && e.location && " · "}{e.time}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link href="/events" className="border-t border-white/10 px-5 py-3 text-sm font-medium text-teal-200 hover:text-white">All events →</Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
