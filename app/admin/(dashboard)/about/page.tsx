"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Loading, ErrorNotice } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/admin/Feedback";
import ImagePicker from "@/components/admin/ImagePicker";
import type { AboutContent } from "@/lib/about";

const input = "mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 text-sm focus:border-teal-600";
const area = "mt-1 w-full rounded-lg border border-mist bg-white p-3 text-sm focus:border-teal-600";
const lines = (v: string[]) => v.join("\n\n");
const toLines = (v: string) => v.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);

/** Admin → About Page: the school profile, section by section. */
export default function AdminAbout() {
  const [data, setData] = useState<AboutContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/about?_=${Date.now()}`, { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not load the About page.");
      setData(body);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load the About page."); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/about", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not save.");
      setData(body);
      toast("About page saved — it's live on the website.");
    } catch (e) { toast(e instanceof Error ? e.message : "Could not save.", "error"); }
    finally { setSaving(false); }
  };

  if (error) return <ErrorNotice message={error} onRetry={load} />;
  if (!data) return <Loading label="Loading the About page…" />;
  const d = data;
  const up = (patch: Partial<AboutContent>) => setData({ ...d, ...patch });

  const ImageField = ({ value, onChange, label = "Photo", location, shape }: {
    value: string; onChange: (v: string) => void; label?: string; location: string; shape?: "wide" | "square";
  }) => (
    <ImagePicker
      label={label}
      value={value}
      onChange={onChange}
      folder="about"
      location={location}
      recommended={shape === "square" ? "800 × 800 px" : "1600 × 1200 px"}
      shape={shape}
      emptyText="Default photo"
      removeLabel="Use default photo"
      successMessage="Image uploaded successfully — remember to press Save Changes."
    />
  );

  const PairList = ({ items, onChange, labels }: { items: Array<{ [k: string]: string }>; onChange: (v: Array<{ [k: string]: string }>) => void; labels: [string, string]; }) => (
    <div className="space-y-3">
      {items.map((it, i) => {
        const [k1, k2] = Object.keys(it);
        return (
          <div key={i} className="grid gap-2 rounded-lg border border-mist bg-ivory/50 p-3 sm:grid-cols-[1fr_2fr_auto]">
            <input value={it[k1]} placeholder={labels[0]} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, [k1]: e.target.value } : x)))} className={input} />
            <input value={it[k2]} placeholder={labels[1]} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, [k2]: e.target.value } : x)))} className={input} />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="mt-1 h-11 rounded-lg px-3 text-sm text-red-600 hover:bg-red-50">Remove</button>
          </div>
        );
      })}
      {items.length < 8 && (
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, Object.fromEntries(Object.keys(items[0] ?? { title: "", text: "" }).map((k) => [k, ""]))])}>Add item</Button>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="About Page"
        lead="The school profile families read: introduction, vision and mission, philosophy, values, the principal's message, history and what makes the school different."
        action={<div className="flex gap-2"><a href="/about" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-full border border-mist bg-white px-5 text-sm font-medium text-ink hover:bg-ivory">Preview</a><Button loading={saving} onClick={save}>Save Changes</Button></div>}
      />
      <div className="space-y-6">
        <Card title="School introduction">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm"><span className="font-medium text-ink">Small line</span><input value={d.intro.eyebrow} onChange={(e) => up({ intro: { ...d.intro, eyebrow: e.target.value } })} className={input} /></label>
              <label className="block text-sm sm:col-span-2"><span className="font-medium text-ink">Heading</span><input value={d.intro.heading} onChange={(e) => up({ intro: { ...d.intro, heading: e.target.value } })} className={input} /></label>
            </div>
            <label className="block text-sm"><span className="font-medium text-ink">Highlighted word</span><input value={d.intro.markWord} onChange={(e) => up({ intro: { ...d.intro, markWord: e.target.value } })} className={input} /><span className="mt-1 block text-xs text-slate2">Must appear in the heading.</span></label>
            <label className="block text-sm"><span className="font-medium text-ink">Introduction</span><textarea rows={6} value={lines(d.intro.paragraphs)} onChange={(e) => up({ intro: { ...d.intro, paragraphs: toLines(e.target.value) } })} className={area} /><span className="mt-1 block text-xs text-slate2">Leave a blank line between paragraphs.</span></label>
            <ImageField value={d.intro.image} onChange={(v) => up({ intro: { ...d.intro, image: v } })} location="About page → School introduction" />
            <label className="block text-sm"><span className="font-medium text-ink">Photo caption</span><input value={d.intro.imageCaption} onChange={(e) => up({ intro: { ...d.intro, imageCaption: e.target.value } })} className={input} /></label>
          </div>
        </Card>

        <Card title="Vision & mission">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm"><span className="font-medium text-ink">Vision</span><textarea rows={4} value={d.vision} onChange={(e) => up({ vision: e.target.value })} className={area} /></label>
            <label className="block text-sm"><span className="font-medium text-ink">Mission</span><textarea rows={4} value={d.mission} onChange={(e) => up({ mission: e.target.value })} className={area} /></label>
          </div>
        </Card>

        <Card title="Educational philosophy">
          <div className="space-y-4">
            <label className="block text-sm"><span className="font-medium text-ink">Heading</span><input value={d.philosophy.heading} onChange={(e) => up({ philosophy: { ...d.philosophy, heading: e.target.value } })} className={input} /></label>
            <label className="block text-sm"><span className="font-medium text-ink">Text</span><textarea rows={5} value={lines(d.philosophy.paragraphs)} onChange={(e) => up({ philosophy: { ...d.philosophy, paragraphs: toLines(e.target.value) } })} className={area} /></label>
            <ImageField value={d.philosophy.image} onChange={(v) => up({ philosophy: { ...d.philosophy, image: v } })} location="About page → Educational philosophy" />
          </div>
        </Card>

        <Card title="School values">
          <PairList items={d.values} onChange={(v) => up({ values: v as AboutContent["values"] })} labels={["Value", "One line that explains it"]} />
        </Card>

        <Card title="Principal's message">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm"><span className="font-medium text-ink">Name</span><input value={d.principal.name} onChange={(e) => up({ principal: { ...d.principal, name: e.target.value } })} placeholder="Leave blank to use the name from Settings" className={input} /></label>
              <label className="block text-sm"><span className="font-medium text-ink">Designation</span><input value={d.principal.designation} onChange={(e) => up({ principal: { ...d.principal, designation: e.target.value } })} className={input} /></label>
            </div>
            <ImageField label="Photo of the principal" value={d.principal.photo} onChange={(v) => up({ principal: { ...d.principal, photo: v } })} location="About page → Principal's message" shape="square" />
            <label className="block text-sm"><span className="font-medium text-ink">Message</span><textarea rows={7} value={lines(d.principal.message)} onChange={(e) => up({ principal: { ...d.principal, message: toLines(e.target.value) } })} className={area} /></label>
          </div>
        </Card>

        <Card title="History">
          <div className="space-y-4">
            <label className="block text-sm"><span className="font-medium text-ink">Heading</span><input value={d.history.heading} onChange={(e) => up({ history: { ...d.history, heading: e.target.value } })} className={input} /></label>
            <label className="block text-sm"><span className="font-medium text-ink">Background</span><textarea rows={5} value={lines(d.history.paragraphs)} onChange={(e) => up({ history: { ...d.history, paragraphs: toLines(e.target.value) } })} className={area} /></label>
            <div className="text-sm"><span className="font-medium text-ink">Milestones</span>
              <div className="mt-2"><PairList items={d.history.milestones} onChange={(v) => up({ history: { ...d.history, milestones: v as AboutContent["history"]["milestones"] } })} labels={["Year", "What happened"]} /></div>
            </div>
          </div>
        </Card>

        <Card title="What makes the school different">
          <PairList items={d.different} onChange={(v) => up({ different: v as AboutContent["different"] })} labels={["Title", "One or two sentences"]} />
        </Card>

        <div className="flex justify-end"><Button loading={saving} onClick={save}>Save Changes</Button></div>
      </div>
    </div>
  );
}
