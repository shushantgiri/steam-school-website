import Hero from "@/components/site/home/Hero";
import AboutPreview from "@/components/site/home/AboutPreview";
import Stats from "@/components/site/home/Stats";
import { NoticesAndEvents } from "@/components/site/home/LatestNews";
import LifeAtSchool from "@/components/site/home/LifeAtSchool";
import StudentExperience from "@/components/site/home/StudentExperience";
import Teachers from "@/components/site/home/Teachers";
import SchoolVideo from "@/components/site/home/SchoolVideo";
import Moments from "@/components/site/home/Moments";
import FinalCTA from "@/components/site/home/FinalCTA";

/**
 * Homepage: Hero → School Introduction → Notices & Events → Learning →
 * Student Life → Teachers → School video → Gallery → CTA. All CMS-driven;
 * sections hide themselves when they have no content.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutPreview />
      <NoticesAndEvents />
      <Stats />
      <LifeAtSchool />
      <StudentExperience />
      <Teachers />
      <SchoolVideo />
      <Moments />
      <FinalCTA />
    </>
  );
}