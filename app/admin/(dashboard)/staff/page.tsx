"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, User } from "lucide-react";
import { PageHeader, Card, Loading, ErrorNotice, NoResults } from "@/components/admin/ui";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { askConfirm, toast } from "@/components/admin/Feedback";
import ImagePicker from "@/components/admin/ImagePicker";
import { STAFF_CATEGORIES, STAFF_CATEGORY_LABELS, type StaffMember } from "@/lib/staff-shared";

type Draft = Omit<StaffMember, "id"> & { id?: string };
const empty: Draft = { name: "", designation: "", category: "Teacher", subjects: "", photo: "", bio: "", qualification: "", featured: true, order: 0, status: "Published" };
const inputCls = "mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 focus:border-teal-600";

/** Teachers & staff profiles with photos — shown on the homepage and About page. */
export default function AdminStaff() {
  const [rows, setRows] = useState<StaffMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/staff?_=${Date.now()}`, { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not load teachers and staff.");
      setRows(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load teachers and staff.");
      setRows([]);
    }
  };
  useEffect(() => { load(); }, []);

  const act = async (action: "create" | "update" | "delete", member: Partial<StaffMember>) => {
    const res = await fetch("/api/staff", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, member }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error || "Something went wrong.");
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await act(draft.id ? "update" : "create", draft);
      toast(draft.id ? "Profile updated." : `${draft.name} added.`);
      setDraft(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save.", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m: StaffMember) => {
    const ok = await askConfirm({
      title: `Remove ${m.name}?`,
      body: "The profile disappears from the website immediately. This cannot be undone.",
      confirmLabel: "Remove", danger: true,
    });
    if (!ok) return;
    try { await act("delete", { id: m.id }); toast("Profile removed.", "info"); load(); }
    catch (e) { toast(e instanceof Error ? e.message : "Could not remove.", "error"); }
  };

  return (
    <div>
      <PageHeader
        title="Teachers & Staff"
        lead="The staff directory. Add, edit, reorder, publish or unpublish profiles; profiles marked Homepage also appear in the homepage teachers section."
        action={<Button onClick={() => setDraft({ ...empty, order: (rows?.length ?? 0) + 1 })}><Plus className="h-4 w-4" /> Add Person</Button>}
      />
      {error && <ErrorNotice message={error} onRetry={load} />}
      <Card>
        {rows === null ? (
          <Loading label="Loading teachers and staff…" />
        ) : rows.length === 0 ? (
          <NoResults title="No teachers or staff yet" hint="Add the principal and teachers with photos — families want to see who teaches their children." />
        ) : (
          <ul className="divide-y divide-mist">
            {rows.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-1 last:pb-1">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-ivory">
                  {m.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo} alt="" className="h-full w-full object-cover" />
                  ) : <User className="m-4 h-6 w-6 text-slate2" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{m.name}</p>
                    <Badge tone={m.status === "Published" ? "teal" : "gray"}>{m.status}</Badge>
                    {m.featured && <Badge tone="gray">Homepage</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-slate2">{m.designation}{m.subjects && ` · ${m.subjects}`} <span className="text-slate2/70">· {STAFF_CATEGORY_LABELS[m.category]}</span></p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDraft({ ...m })}><Pencil className="h-4 w-4" /> Edit</Button>
                  <Button variant="ghost" size="sm" className="!text-red-600 hover:!bg-red-50" onClick={() => remove(m)} aria-label={`Remove ${m.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Edit staff profile">
          <button aria-label="Close" onClick={() => setDraft(null)} className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" />
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl2 border border-mist bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-mist pb-4">
              <h2 className="text-lg font-semibold text-ink">{draft.id ? "Edit" : "Add"} Teacher / Staff</h2>
              <button onClick={() => setDraft(null)} aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-lg border border-mist text-slate2 hover:border-ink/40 hover:text-ink"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <ImagePicker
                label="Profile photo"
                value={draft.photo}
                onChange={(url) => setDraft((d) => (d ? { ...d, photo: url } : d))}
                folder="staff"
                location="Teachers & Staff → Profile photo"
                recommended="600 × 600 px"
                shape="square"
                emptyText="No photo yet"
                removeLabel="Remove photo"
                successMessage="Photo uploaded successfully — remember to save this profile."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="font-medium text-ink">Full name *</span>
                  <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} /></label>
                <label className="block"><span className="font-medium text-ink">Designation *</span>
                  <input value={draft.designation} onChange={(e) => setDraft({ ...draft, designation: e.target.value })} placeholder="e.g. Principal, Science Teacher" className={inputCls} /></label>
              </div>
              <label className="block"><span className="font-medium text-ink">Directory group</span>
                <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Draft["category"] })} className={inputCls}>
                  {STAFF_CATEGORIES.map((c) => <option key={c} value={c}>{STAFF_CATEGORY_LABELS[c]}</option>)}
                </select></label>
              <label className="block"><span className="font-medium text-ink">Subjects / responsibilities</span>
                <input value={draft.subjects} onChange={(e) => setDraft({ ...draft, subjects: e.target.value })} placeholder="e.g. Mathematics · Grades 6–8" className={inputCls} /></label>
              <label className="block"><span className="font-medium text-ink">Qualification / experience</span>
                <input value={draft.qualification} onChange={(e) => setDraft({ ...draft, qualification: e.target.value })} placeholder="e.g. M.Ed. · 12 years of teaching" className={inputCls} /></label>
              <label className="block"><span className="font-medium text-ink">Short introduction</span>
                <textarea rows={3} maxLength={400} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  placeholder="One or two sentences families will read." className="mt-1 w-full rounded-lg border border-mist bg-white p-3 focus:border-teal-600" /></label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block"><span className="font-medium text-ink">Order</span>
                  <input type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })} className={inputCls} /></label>
                <label className="block"><span className="font-medium text-ink">Homepage</span>
                  <select value={draft.featured ? "Yes" : "No"} onChange={(e) => setDraft({ ...draft, featured: e.target.value === "Yes" })} className={inputCls}>
                    <option>Yes</option><option>No</option></select></label>
                <label className="block"><span className="font-medium text-ink">Status</span>
                  <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })} className={inputCls}>
                    <option>Published</option><option>Draft</option></select></label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button loading={saving} onClick={save}>{draft.id ? "Save Changes" : "Add Person"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
