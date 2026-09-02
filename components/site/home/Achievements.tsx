import Link from "next/link";
import { ArrowRight, Award, Medal, Star, Trophy } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { getPublicPosts } from "@/lib/data";
import { formatDate } from "@/lib/format";

const ICONS = [Trophy, Award, Medal, Star];

/**
 * Proud Moments — 3–4 achievements as small icon + short line, drawn from
 * published stories about awards, competitions and wins (category
 * "Achievement" or matching words). Hidden until there is at least one.
 */
export default async function Achievements() {
  const wins = (await getPublicPosts())
    .filter((p) => p.category !== "Event")
    .filter((p) => /achiev|award|winner|champion|medal|trophy|prize|topper|first position|won /i.test(`${p.title} ${p.excerpt} ${p.category}`))
    .slice(0, 4);
  if (wins.length === 0) return null;
  return (
    <section className="bg-white" aria-labelledby="achievements-heading">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
          <Reveal>
            <p className="eyebrow">Achievements</p>
            <h2 id="achievements-heading" className="display mt-3 text-3xl sm:text-4xl">Proud <span className="mark">moments</span></h2>
            <p className="mt-4 max-w-sm text-base text-charcoal">Real stories of what our students and teams have accomplished.</p>
            <Link href="/news" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline">View more achievements <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2">
            {wins.map((w, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <Reveal key={w.slug} delay={i * 70}>
                  <li className="h-full">
                    <Link href={`/news/${w.slug}`} className="group flex h-full gap-4 rounded-xl2 border border-mist bg-paper p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700"><Icon className="h-5 w-5" /></span>
                      <span>
                        <span className="line-clamp-2 block font-semibold leading-snug text-ink group-hover:text-teal-700">{w.title}</span>
                        <span className="mt-1 block text-xs text-slate2">{formatDate(w.date)}</span>
                      </span>
                    </Link>
                  </li>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
