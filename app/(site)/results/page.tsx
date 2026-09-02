import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/Section";
import ResultSearch from "@/components/site/ResultSearch";
import { enabledClassNames, getAcademics } from "@/lib/academics";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Examination Results",
  description:
    "Search published examination results of The School of STEAM Education by student name, date of birth (BS) and class.",
};

export default async function ResultsPage() {
  const [setup, settings] = await Promise.all([getAcademics(), getSettings()]);
  return (
    <>
      <PageHero
        eyebrow="Examination Results"
        title={<>Find your examination <span className="mark">result</span></>}
        lead="Enter the student's full name exactly as registered with the school, their date of birth in Bikram Sambat, and their class. Only results the school has published can be found."
      />
      <Section>
        <div className="mx-auto max-w-xl">
          <ResultSearch
            classes={enabledClassNames(setup)}
            years={setup.academicYears}
            schoolName={settings.name}
          />
        </div>
      </Section>
    </>
  );
}
