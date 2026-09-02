import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { getPostBySlug } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { ButtonLink } from "@/components/ui/Button";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  return { title: post?.title ?? "Post" };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <article className="bg-paper pt-28 sm:pt-36">
      <div className="mx-auto max-w-3xl px-5 pb-20 sm:px-8">
        <Link href="/news" className="inline-flex items-center gap-2 text-sm font-medium text-slate2 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> All news &amp; notices
        </Link>
        <div className="mt-8 flex items-center gap-3">
          <Badge tone={post.category === "Notice" ? "sun" : post.category === "News" ? "teal" : "gray"}>{post.category}</Badge>
          <time dateTime={post.date} className="text-sm text-slate2">{formatDate(post.date)}</time>
        </div>
        <h1 className="display mt-4 text-3xl sm:text-4xl lg:text-5xl">{post.title}</h1>
        {post.image && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl2">
            <Image src={post.image} alt="" fill sizes="(min-width:768px) 48rem, 100vw" className="object-cover" />
          </div>
        )}
        <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-charcoal">
          {post.body.map((para, i) => <p key={i}>{para}</p>)}
        </div>
        {post.attachment && (
          <a
            href="#"
            className="mt-8 flex items-center justify-between rounded-xl2 border border-mist bg-white p-5 shadow-soft transition-shadow hover:shadow-lift"
          >
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-50 text-teal-700"><Download className="h-5 w-5" /></span>
              <div>
                <p className="font-medium text-ink">{post.attachment}</p>
                <p className="text-xs text-slate2">PDF attachment · Download</p>
              </div>
            </div>
          </a>
        )}
        <div className="mt-12 border-t border-mist pt-8">
          <ButtonLink href="/news" variant="outline">Back to News &amp; Notices</ButtonLink>
        </div>
      </div>
    </article>
  );
}
