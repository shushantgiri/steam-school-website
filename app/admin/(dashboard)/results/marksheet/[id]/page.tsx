"use client";
import { useSearchParams } from "next/navigation";
import MarksheetViewer from "@/components/results/MarksheetViewer";

/** Staff preview of a student's marksheet (works for draft batches too). */
export default function AdminMarksheetPage({ params }: { params: { id: string } }) {
  const sp = useSearchParams();
  const batch = sp.get("batch");
  return (
    <MarksheetViewer
      id={params.id}
      backHref={batch ? `/admin/results?batch=${batch}` : "/admin/results"}
      backLabel="Back to results"
    />
  );
}
