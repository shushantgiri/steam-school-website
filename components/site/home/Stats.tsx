import { getHomepage, withMark } from "@/lib/homepage";
import StatsBand from "./StatsBand";

/** "Our School in Numbers" — content and ordering come from the CMS. */
export default async function Stats() {
  const { stats } = await getHomepage();
  const items = stats.items.filter((s) => s.enabled);
  if (items.length === 0) return null;
  return (
    <StatsBand
      eyebrow={stats.eyebrow}
      markParts={withMark(stats.heading, stats.markWord)}
      stats={items.map(({ value, label }) => ({ value, label }))}
    />
  );
}
