"use client";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { PageHeader, Card, Loading, ErrorNotice } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/admin/Feedback";
import ImagePicker from "@/components/admin/ImagePicker";
import type { HomepageContent } from "@/lib/homepage";

type SectionKey = keyof HomepageContent;

/**
 * Edits every headline section of the live homepage — text, links and photos.
 * The photo grids inside Academics/Facilities/Student Life still come from
 * the site's built-in content; these editors own each section's header,
 * button and (where present) main image.
 */
export default function AdminHomepage() {
  const [data, setData] = useState<HomepageContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/homepage?_=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load homepage content.");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load homepage content.");
    }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not save.");
      setData(body);
      toast("Homepage saved — it's live on the website.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const setStat = (i: number, patch: Partial<HomepageContent["stats"]["items"][number]>) =>
    setData((d) => {
      if (!d) return d;
      const items = d.stats.items.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
      return { ...d, stats: { ...d.stats, items } };
    });
  const moveStat = (i: number, delta: number) =>
    setData((d) => {
      if (!d) return d;
      const items = [...d.stats.items];
      const j = i + delta;
      if (j < 0 || j >= items.length) return d;
      [items[i], items[j]] = [items[j], items[i]];
      return { ...d, stats: { ...d.stats, items } };
    });
  const removeStat = (i: number) =>
    setData((d) => (d ? { ...d, stats: { ...d.stats, items: d.stats.items.filter((_, idx) => idx !== i) } } : d));
  const addStat = () =>
    setData((d) =>
      d
        ? { ...d, stats: { ...d.stats, items: [...d.stats.items, { id: crypto.randomUUID(), value: "", label: "", enabled: true }] } }
        : d
    );

  const set = (section: SectionKey, key: string, v: string) =>
    setData((d) => (d ? { ...d, [section]: { ...d[section], [key]: v } } : d));
  const val = (section: SectionKey, key: string) =>
    ((data as unknown as Record<string, Record<string, string>>)?.[section]?.[key] ?? "");

  const Field = ({ section, k, label, textarea, help }: { section: SectionKey; k: string; label: string; textarea?: boolean; help?: string }) => (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      {textarea ? (
        <textarea rows={3} value={val(section, k)} onChange={(e) => set(section, k, e.target.value)}
          className="mt-1 w-full rounded-lg border border-mist bg-white p-3 focus:border-teal-600" />
      ) : (
        <input value={val(section, k)} onChange={(e) => set(section, k, e.target.value)}
          className="mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 focus:border-teal-600" />
      )}
      {help && <span className="mt-1 block text-xs text-slate2">{help}</span>}
    </label>
  );

  /** Every homepage photo slot: where it appears + recommended size. */
  const IMAGE_SLOTS: Partial<Record<SectionKey, { label: string; location: string; recommended: string }>> = {
    hero: { label: "Hero photo", location: "Homepage → Hero (the big opening photo)", recommended: "1920 × 1080 px" },
    about: { label: "About photo", location: "Homepage → About the School section", recommended: "1600 × 1200 px" },
    video: { label: "Video poster image", location: "Homepage → School video (shown before play)", recommended: "1600 × 900 px" },
  };

  const ImageField = ({ section }: { section: SectionKey }) => {
    const slot = IMAGE_SLOTS[section] ?? { label: "Photo", location: "Homepage", recommended: "1600 × 900 px" };
    return (
      <ImagePicker
        label={slot.label}
        value={val(section, "image")}
        onChange={(url) => set(section, "image", url)}
        folder="homepage"
        location={slot.location}
        recommended={slot.recommended}
        emptyText="Default photo"
        removeLabel="Use default photo"
        successMessage="Image uploaded successfully — remember to press Save Changes."
      />
    );
  };

  if (!data && !error) return <Loading label="Loading homepage content…" />;

  return (
    <div>
      <PageHeader
        title="Homepage"
        lead="What families see first. Changes go live on the website as soon as you save."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open("/", "_blank")}>
              <ExternalLink className="h-4 w-4" /> Preview
            </Button>
            <Button loading={saving} onClick={save}>Save Changes</Button>
          </div>
        }
      />
      {error && <ErrorNotice message={error} onRetry={load} />}
      {data && (
        <div className="space-y-6">
          <Card title="Hero — the opening screen" id="hero">
            <div className="space-y-4">
              <ImageField section="hero" />
              {Field({ section: "hero", k: "eyebrow", label: "Small line above the heading" })}
              <div className="grid gap-4 sm:grid-cols-2">
                {Field({ section: "hero", k: "headingTop", label: "Heading — first line" })}
                {Field({ section: "hero", k: "headingBottom", label: "Heading — second line" })}
              </div>
              {Field({ section: "hero", k: "markWord", label: "Underlined word", help: "Gets the yellow underline; must appear in the heading." })}
              {Field({ section: "hero", k: "description", label: "Short description", textarea: true })}
              <div className="grid gap-4 sm:grid-cols-2">
                {Field({ section: "hero", k: "primaryLabel", label: "Main button text" })}
                {Field({ section: "hero", k: "primaryHref", label: "Main button link", help: "e.g. /admissions/apply" })}
                {Field({ section: "hero", k: "secondaryLabel", label: "Second button text" })}
                {Field({ section: "hero", k: "secondaryHref", label: "Second button link" })}
              </div>
            </div>
          </Card>

          <Card title="About the School" id="about">
            <div className="space-y-4">
              <ImageField section="about" />
              {Field({ section: "about", k: "eyebrow", label: "Small line" })}
              <div className="grid gap-4 sm:grid-cols-2">
                {Field({ section: "about", k: "headingTop", label: "Heading — first line" })}
                {Field({ section: "about", k: "headingBottom", label: "Heading — second line" })}
              </div>
              {Field({ section: "about", k: "markWord", label: "Underlined word" })}
              {Field({ section: "about", k: "description", label: "Paragraph", textarea: true })}
              <div className="grid gap-4 sm:grid-cols-2">
                {Field({ section: "about", k: "primaryLabel", label: "Button text" })}
                {Field({ section: "about", k: "primaryHref", label: "Button link" })}
              </div>
            </div>
          </Card>

          {(
            [
              ["academics", "Academics section header"],
              ["studentLife", "Student Life section header"],
            ] as Array<[SectionKey, string]>
          ).map(([key, title]) => (
            <Card key={key} title={title} id={key === "studentLife" ? "student-life" : key}>
              <div className="space-y-4">
                {Field({ section: key, k: "eyebrow", label: "Small line" })}
                <div className="grid gap-4 sm:grid-cols-2">
                  {Field({ section: key, k: "heading", label: "Heading" })}
                  {Field({ section: key, k: "markWord", label: "Underlined word" })}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Field({ section: key, k: "primaryLabel", label: "Button text" })}
                  {Field({ section: key, k: "primaryHref", label: "Button link" })}
                </div>
                <p className="text-xs text-slate2">
                  The photo cards inside this section come from the site's built-in content for now.
                </p>
              </div>
            </Card>
          ))}

          <Card title="School video — See Us in Action" id="video">
            <div className="space-y-4">
              <p className="text-xs text-slate2">Paste a YouTube or Vimeo link (or a direct .mp4 link). The section appears on the homepage only when a link is set. The poster is the still image shown before play; leave it blank to use a gallery photo.</p>
              <Field section="video" k="url" label="Video link" help="e.g. https://www.youtube.com/watch?v=… — clear it to hide the section." />
              <ImageField section="video" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field section="video" k="eyebrow" label="Small line" />
                <Field section="video" k="heading" label="Heading" />
              </div>
              <Field section="video" k="description" label="Short description" />
            </div>
          </Card>

          <Card title="Closing call-to-action — the dark section at the bottom" id="cta">
            <div className="space-y-4">
              {Field({ section: "cta", k: "eyebrow", label: "Small line" })}
              <div className="grid gap-4 sm:grid-cols-2">
                {Field({ section: "cta", k: "heading", label: "Heading" })}
                {Field({ section: "cta", k: "markWord", label: "Underlined word" })}
              </div>
              {Field({ section: "cta", k: "description", label: "Short description", textarea: true })}
              <div className="grid gap-4 sm:grid-cols-2">
                {Field({ section: "cta", k: "primaryLabel", label: "Main button text" })}
                {Field({ section: "cta", k: "primaryHref", label: "Main button link" })}
                {Field({ section: "cta", k: "secondaryLabel", label: "Second button text" })}
                {Field({ section: "cta", k: "secondaryHref", label: "Second button link" })}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
