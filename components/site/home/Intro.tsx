import Reveal from "@/components/ui/Reveal";

export default function Intro() {
  return (
    <section id="intro" className="bg-paper">
      <div className="mx-auto max-w-shell px-5 py-20 sm:px-8 sm:py-28 lg:py-36">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="eyebrow justify-center">Our Belief</p>
          <p className="display mt-6 text-[1.75rem] leading-snug sm:text-4xl lg:text-[2.9rem]">
            Education should inspire students to <span className="mark">question</span>, create and discover.
          </p>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-slate2 sm:text-lg">
            In Deukhuri, we teach science, technology, engineering, arts and mathematics as one connected way of
            thinking — so every student leaves with real skills, real confidence and real curiosity.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
