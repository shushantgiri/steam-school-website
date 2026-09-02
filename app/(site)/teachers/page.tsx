import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/Section";
import StaffDirectory from "@/components/site/StaffDirectory";
import { ButtonLink } from "@/components/ui/Button";
import { getPublishedStaff } from "@/lib/staff";

export const metadata: Metadata = {
  title: "Teachers & Staff",
  description: "Meet the teachers and staff who guide our students every day.",
};

/** Teachers & Staff — the school's staff directory, managed in the CMS. */
export default async function TeachersPage() {
  const staff = await getPublishedStaff();
  return (
    <>
      <PageHero
        eyebrow="Teachers & Staff"
        title={<>The people behind every <span className="mark">lesson</span></>}
        lead="Teachers who know every student by name. Tap a profile to read more."
      />
      <Section compact>
        {staff.length === 0 ? (
          <div className="rounded-xl2 border border-mist bg-white p-10 text-center text-charcoal">
            Teacher profiles are being added. Please check back soon.
          </div>
        ) : (
          <StaffDirectory staff={staff} />
        )}
      </Section>
      <Section tone="ink" compact>
        <div className="flex flex-col items-start justify-between gap-5 py-2 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow !text-teal-200">Join Our Team</p>
            <h2 className="display mt-2 text-2xl !text-white sm:text-3xl">Passionate about teaching?</h2>
          </div>
          <ButtonLink href="/contact" variant="outline" className="!border-white/40 !text-white hover:!bg-white/10">Get in touch</ButtonLink>
        </div>
      </Section>
    </>
  );
}
