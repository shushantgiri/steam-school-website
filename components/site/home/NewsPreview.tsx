import Link from "next/link";
import { ArrowRight, Paperclip } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { SectionHead } from "@/components/site/Section";
import { ButtonLink } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { getPublicPosts } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default async function NewsPreview() {
  const latest = (await getPublicPosts()).slice(0, 3);
  return (
    <section className="border-t border-mist bg-paper">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow="News & Notices" title={<>What&rsquo;s <span className="mark">Happening</span></>} />
          <Reveal><ButtonLink href="/news" variant="outline">View All News &amp; Notices</ButtonLink></Reveal>
        </div>
        <div className="mt-10 divide-y divide-mist border-y border-mist">
          {latest.map((p, i) => (
            <Reveal key={p.slug} delay={i * 70}>
              <Link href={`/news/${p.slug}`} className="group grid gap-3 py-6 sm:grid-cols-[8rem_1fr_auto] sm:items-center sm:gap-8 sm:py-7">
                <time dateTime={p.date} className="text-sm font-medium text-slate2">{formatDate(p.date)}</time>
                <div>
                  <div className="flex items-center gap-3">
                    <Badge tone={p.category === "Notice" ? "sun" : p.category === "News" ? "teal" : "gray"}>{p.category}</Badge>
                    {p.attachment && <Paperclip className="h-3.5 w-3.5 text-slate2" aria-label="Has attachment" />}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-ink transition-colors group-hover:text-teal-700">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate2">{p.excerpt}</p>
                </div>
                <ArrowRight className="hidden h-5 w-5 text-slate2 transition-transform group-hover:translate-x-1 sm:block" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
