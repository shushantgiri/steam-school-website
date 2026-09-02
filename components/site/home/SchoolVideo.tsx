import Reveal from "@/components/ui/Reveal";
import VideoPlayer from "@/components/site/VideoPlayer";
import { getHomepage } from "@/lib/homepage";
import { getPublicPhotos } from "@/lib/gallery";
import { img } from "@/lib/images";

/**
 * See Us in Action — one short school video behind a poster and play
 * button. Set the link in Admin → Homepage → School video; hidden until then.
 */
export default async function SchoolVideo() {
  const [{ video }, photos] = await Promise.all([getHomepage(), getPublicPhotos()]);
  if (!video.url) return null;
  const poster = video.image || photos.find((p) => /assembl|event|celebrat|student/i.test(`${p.category} ${p.alt}`))?.src || img.event;
  return (
    <section className="bg-white" aria-labelledby="video-heading">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-24 lg:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">{video.eyebrow}</p>
          <h2 id="video-heading" className="display mt-3 text-3xl sm:text-4xl lg:text-5xl">{video.heading}</h2>
          {video.description && <p className="mt-4 text-base text-charcoal sm:text-lg">{video.description}</p>}
        </Reveal>
        <Reveal delay={120} className="mx-auto mt-12 max-w-5xl">
          <VideoPlayer url={video.url} poster={poster} title={video.heading} />
        </Reveal>
      </div>
    </section>
  );
}
