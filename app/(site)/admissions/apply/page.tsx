import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/Section";
import AdmissionForm from "@/components/site/AdmissionForm";

export const metadata: Metadata = { title: "Apply" };

export default function ApplyPage() {
  return (
    <>
      <PageHero
        eyebrow="Online Application · 2083"
        title={<>Apply in about ten <span className="mark">minutes</span></>}
        lead="Five short steps. Submitting the form does not commit you to anything — it simply starts the conversation."
      />
      <Section>
        <AdmissionForm />
      </Section>
    </>
  );
}
