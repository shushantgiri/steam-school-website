import Link from "next/link";
import { ArrowRight, Award, Medal, Trophy } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import PhotoMasonry from "@/components/site/Lightbox";
import { ButtonLink } from "@/components/ui/Button";
import { getPublicPosts } from "@/lib/data";
import { getPublicPhotos } from "@/lib/gallery";

const ICONS = [Trophy, Award, Medal];

/**
 * Achievements (compact list from news stories about awards and wins) beside
 * School Moments (a masonry of real photos with a lightbox). Either half
 * hides when it has nothing to show.
 */
export default async function AchievementsMoments() {
  const [posts, photos] = await Promise.all([getPublicPosts(), getPublicPhotos()]);
  const wins = posts
    .filter((p) => p.category !== "Event")
    .filter((p) => /achiev|award|winner|champion|medal|trophy|prize|topper|first position|won /i.test(`${p.title} ${p.excerpt} ${p.category}`))
    .slice(0, 4);
  const moments = photos.slice(0, 7);
  if (wins.length === 0 && moments.length < 4) return null;

  return (
    <section className="bg-white" aria-label="Achievements and school moments">
      <div className="mx-auto max-w-shell px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className={`grid gap-6 lg:gap-8 ${wins.length > 0 && moments.length >= 4 ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]" : ""}`}>
          {wins.length > 0 && (
            <Reveal className="flex">
              <div className="flex w-full flex-col rounded-xl2 bg-ivory p-5 sm:p-6">
                <p className="eyebrow">Achievements</p>
                <h2 className="display mt-2 text-2xl sm:text-3xl">Proud <span className="mark">moments</span></h2>
                <ul className="mt-5 space-y-4">
                  {wins.map((w, i) => {
                    const Icon = ICONS[i % ICONS.length];
                    return (
                      <li key={w.slug}>
                        <Link href={`/news/${w.slug}`} className="group flex items-start gap-3">
                          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-teal-700 shadow-soft"><Icon className="h-4 w-4" /></span>
                          <span className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-teal-700">{w.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <Link href="/news" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-teal-700 hover:underline">View more achievements <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </Reveal>
          )}
          {moments.length >= 4 && (
            <Reveal delay={100}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="eyebrow">School Moments</p>
                  <h2 className="display mt-2 text-2xl sm:text-3xl">Moments that <span className="mark">matter</span></h2>
                </div>
                <ButtonLink href="/gallery" size="sm">View Full Gallery <ArrowRight className="h-4 w-4" /></ButtonLink>
              </div>
              <div className="mt-6">
                <PhotoMasonry photos={moments.map((p) => ({ src: p.src, alt: p.alt || p.category }))} />
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
