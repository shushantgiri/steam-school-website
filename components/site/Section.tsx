import Reveal from "@/components/ui/Reveal";

export function Section({
  children,
  className = "",
  tone = "paper",
  id,
  compact = false,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "paper" | "ivory" | "ink" | "white";
  id?: string;
  /** Tighter vertical padding for short bands (directory, calls to action). */
  compact?: boolean;
}) {
  const tones = { paper: "bg-paper", ivory: "bg-ivory", ink: "bg-ink text-white", white: "bg-white" };
  return (
    <section id={id} style={id ? { scrollMarginTop: "6rem" } : undefined} className={`${tones[tone]} ${className}`}>
      <div className={`mx-auto max-w-shell px-5 sm:px-8 ${compact ? "py-10 sm:py-12" : "py-12 sm:py-16 lg:py-24"}`}>{children}</div>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lead,
  dark = false,
  className = "",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <Reveal className={`max-w-2xl ${className}`}>
      <p className={`eyebrow ${dark ? "!text-teal-200" : ""}`}>{eyebrow}</p>
      <h2 className={`display mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] ${dark ? "!text-white" : ""}`}>{title}</h2>
      {lead && <p className={`mt-5 text-base leading-relaxed sm:text-lg ${dark ? "text-white/70" : "text-slate2"}`}>{lead}</p>}
    </Reveal>
  );
}

export function PageHero({ eyebrow, title, lead }: { eyebrow: string; title: React.ReactNode; lead?: string }) {
  return (
    <div className="bg-ivory pt-28 sm:pt-36">
      <div className="mx-auto max-w-shell px-5 pb-14 sm:px-8 sm:pb-20">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display mt-4 max-w-3xl text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
          {lead && <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate2 sm:text-lg">{lead}</p>}
        </Reveal>
      </div>
    </div>
  );
}
