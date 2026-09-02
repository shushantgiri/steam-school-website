"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { PageHeader, Card, Loading, ErrorNotice, NoResults } from "@/components/admin/ui";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { askConfirm, toast } from "@/components/admin/Feedback";
import type { Testimonial } from "@/lib/testimonials";

type Draft = { id?: string; name: string; role: string; quote: string; status: "Published" | "Draft" };
const empty: Draft = { name: "", role: "", quote: "", status: "Published" };

/** Parent & student quotes shown on the homepage. */
export default function AdminTestimonials() {
  const [rows, setRows] = useState<Testimonial[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch("/api/testimonials", { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not load testimonials.");
      setRows(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load testimonials.");
      setRows([]);
    }
  };
  useEffect(() => { load(); }, []);

  const act = async (action: "create" | "update" | "delete", testimonial: Partial<Testimonial>) => {
    const res = await fetch("/api/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, testimonial }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error || "Something went wrong.");
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await act(draft.id ? "update" : "create", draft);
      toast(draft.id ? "Testimonial updated." : "Testimonial added.");
      setDraft(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save.", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: Testimonial) => {
    const ok = await askConfirm({
      title: `Delete ${t.name}'s testimonial?`,
      body: "It disappears from the homepage immediately. This cannot be undone.",
      confirmLabel: "Delete", danger: true,
    });
    if (!ok) return;
    try {
      await act("delete", { id: t.id });
      toast("Testimonial deleted.", "info");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete.", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Testimonials"
        lead="Short quotes from parents and students. The three newest Published ones appear on the homepage."
        action={<Button onClick={() => setDraft({ ...empty })}><Plus className="h-4 w-4" /> Add Testimonial</Button>}
      />
      {error && <ErrorNotice message={error} onRetry={load} />}
      <Card>
        {rows === null ? (
          <Loading label="Loading testimonials…" />
        ) : rows.length === 0 ? (
          <NoResults title="No testimonials yet" hint="Add the first quote from a parent or student." />
        ) : (
          <ul className="divide-y divide-mist">
            {rows.map((t) => (
              <li key={t.id} className="flex flex-wrap items-start gap-3 py-4 first:pt-1 last:pb-1">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{t.name}</p>
                    {t.role && <p className="text-sm text-slate2">· {t.role}</p>}
                    <Badge tone={t.status === "Published" ? "teal" : "gray"}>{t.status}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal">“{t.quote}”</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDraft({ ...t })}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="!text-red-600 hover:!bg-red-50" onClick={() => remove(t)} aria-label={`Delete ${t.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Edit testimonial">
          <button aria-label="Close" onClick={() => setDraft(null)} className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-md rounded-xl2 border border-mist bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-mist pb-4">
              <h2 className="text-lg font-semibold text-ink">{draft.id ? "Edit" : "Add"} Testimonial</h2>
              <button onClick={() => setDraft(null)} aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-lg border border-mist text-slate2 hover:border-ink/40 hover:text-ink"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <label className="block">
                <span className="font-medium text-ink">Name</span>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 focus:border-teal-600" />
              </label>
              <label className="block">
                <span className="font-medium text-ink">Role</span>
                <input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                  placeholder="e.g. Parent · Grade 6 student"
                  className="mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 focus:border-teal-600" />
              </label>
              <label className="block">
                <span className="font-medium text-ink">Quote</span>
                <textarea rows={4} maxLength={400} value={draft.quote} onChange={(e) => setDraft({ ...draft, quote: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-mist bg-white p-3 focus:border-teal-600" />
                <span className="mt-1 block text-xs text-slate2">{400 - draft.quote.length} characters left</span>
              </label>
              <label className="block">
                <span className="font-medium text-ink">Status</span>
                <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })}
                  className="mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3">
                  <option>Published</option>
                  <option>Draft</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button loading={saving} onClick={save}>{draft.id ? "Save Changes" : "Add Testimonial"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
