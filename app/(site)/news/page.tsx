import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/Section";
import NewsList from "@/components/site/NewsList";
import { getPublicPosts } from "@/lib/data";

export const metadata: Metadata = { title: "News & Notices" };

export default async function NewsPage() {
  const posts = await getPublicPosts();
  const important = posts.find((p) => p.important) ?? null;
  return (
    <>
      <PageHero
        eyebrow="News & Notices"
        title={<>What&rsquo;s <span className="mark">Happening</span></>}
        lead="Official notices, school news, events, exam schedules and holidays — all in one place."
      />
      <Section>
        <NewsList posts={posts} important={important} />
      </Section>
    </>
  );
}
