import type { Metadata } from "next";
import MarksheetViewer from "@/components/results/MarksheetViewer";

export const metadata: Metadata = { title: "Grade Sheet", robots: { index: false, follow: false } };

/** Public marksheet — reachable only with the token from a successful result search. */
export default function PublicMarksheetPage({ params, searchParams }: {
  params: { id: string };
  searchParams: { t?: string };
}) {
  return (
    <div className="pt-20">
      <MarksheetViewer id={params.id} token={searchParams.t} backHref="/results" backLabel="Back to result search" />
    </div>
  );
}
