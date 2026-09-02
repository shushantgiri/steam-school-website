import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/Section";
import GalleryGrid from "@/components/site/GalleryGrid";
import { getPublicPhotos } from "@/lib/gallery";

export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const photos = await getPublicPhotos();
  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title={<>School life, in <span className="mark">pictures</span></>}
        lead="Moments from classrooms, labs, fields, stages and tours across the year."
      />
      <Section>
        <GalleryGrid photos={photos} />
      </Section>
    </>
  );
}
