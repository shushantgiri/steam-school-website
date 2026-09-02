import type { Metadata } from "next";
import MaintenancePage from "@/components/site/MaintenancePage";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "We'll Be Back Soon", robots: { index: false, follow: false } };

/** Holding page served (by rewrite) while Maintenance Mode is on. */
export default async function Maintenance() {
  return <MaintenancePage settings={await getSettings()} />;
}
