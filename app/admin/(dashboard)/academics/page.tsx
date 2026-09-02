"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { PageHeader, Card, Loading, ErrorNotice } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { askConfirm, toast } from "@/components/admin/Feedback";
import type { AcademicSetup } from "@/lib/academics";

const inputCls = "h-10 w-full rounded-lg border border-mist bg-white px-3 text-sm focus:border-teal-600";

/**
 * One source of truth for classes, examination types and academic years —
 * used by result uploads, the public result search, filters and academic
 * pages. Disable a class instead of deleting it if old result batches still
 * refer to it.
 */
export default function AdminAcademics() {
  const [setup, setSetup] = useState<AcademicSetup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newExam, setNewExam] = useState("");
  const [newYear, setNewYear] = useState("");

  useEffect(() => {
    fetch(`/api/academics?_=${Date.now()}`, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setSetup)
      .catch(() => setError("Could not load the academic setup."));
  }, []);

  const save = async () => {
    if (!setup) return;
    setSaving(true);
    try {
      const res = await fetch("/api/academics", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(setup),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not save.");
      setSetup(body);
      toast("Academic setup saved.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save.", "error");
    } finally {
      setSaving(false);
    }
  };

  const mut = (fn: (s: AcademicSetup) => void) =>
    setSetup((s) => { if (!s) return s; const c = structuredClone(s); fn(c); return c; });

  if (error) return <ErrorNotice message={error} />;
  if (!setup) return <Loading label="Loading academic setup…" />;

  return (
    <div>
      <PageHeader
        title="Academic Setup"
        lead="Classes, examination types and academic years, used everywhere results and academics are mentioned."
        action={<Button loading={saving} onClick={save}>Save Changes</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Classes">
          <ul className="space-y-2">
            {setup.classes.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2">
                <div className="flex shrink-0 gap-1">
                  <button aria-label="Move up" disabled={i === 0}
                    onClick={() => mut((s) => { [s.classes[i - 1], s.classes[i]] = [s.classes[i], s.classes[i - 1]]; })}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-mist text-slate2 hover:text-ink disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button aria-label="Move down" disabled={i === setup.classes.length - 1}
                    onClick={() => mut((s) => { [s.classes[i], s.classes[i + 1]] = [s.classes[i + 1], s.classes[i]]; })}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-mist text-slate2 hover:text-ink disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                </div>
                <input aria-label="Class name" value={c.name}
                  onChange={(e) => mut((s) => { s.classes[i].name = e.target.value; })}
                  className={`${inputCls} max-w-[11rem]`} />
                <label className="inline-flex items-center gap-2 text-sm text-charcoal">
                  <input type="checkbox" checked={c.enabled}
                    onChange={(e) => mut((s) => { s.classes[i].enabled = e.target.checked; })} />
                  Active
                </label>
                <button aria-label={`Remove ${c.name}`}
                  onClick={async () => {
                    const ok = await askConfirm({
                      title: `Remove class "${c.name}"?`,
                      body: "Existing result batches keep the name; new uploads can no longer choose it. Prefer disabling if unsure.",
                      confirmLabel: "Remove", danger: true,
                    });
                    if (ok) mut((s) => { s.classes.splice(i, 1); });
                  }}
                  className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-slate2 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" className="mt-3"
            onClick={() => mut((s) => { s.classes.push({ id: crypto.randomUUID(), name: "New class", enabled: true }); })}>
            <Plus className="h-4 w-4" /> Add class
          </Button>
        </Card>

        <div className="space-y-4">
          <Card title="Examination Types">
            <ul className="space-y-2">
              {setup.examinations.map((x, i) => (
                <li key={x} className="flex items-center justify-between gap-3 rounded-lg border border-mist px-3 py-2 text-sm">
                  <span className="text-ink">{x}</span>
                  <button aria-label={`Remove ${x}`} onClick={() => mut((s) => { s.examinations.splice(i, 1); })}
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate2 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
            <form className="mt-3 flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              const v = newExam.trim();
              if (!v) return;
              mut((s) => { if (!s.examinations.includes(v)) s.examinations.push(v); });
              setNewExam("");
            }}>
              <input aria-label="New examination" value={newExam} onChange={(e) => setNewExam(e.target.value)}
                placeholder="e.g. Unit Test" className={inputCls} />
              <Button size="sm" type="submit"><Plus className="h-4 w-4" /> Add</Button>
            </form>
          </Card>

          <Card title="Academic Years (BS)">
            <div className="flex flex-wrap gap-2">
              {setup.academicYears.map((y, i) => (
                <span key={y} className="inline-flex items-center gap-1.5 rounded-full border border-mist bg-ivory px-3 py-1.5 text-sm text-ink">
                  {y}
                  <button aria-label={`Remove ${y}`} onClick={() => mut((s) => { s.academicYears.splice(i, 1); })}
                    className="text-slate2 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </span>
              ))}
            </div>
            <form className="mt-3 flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              const v = newYear.trim();
              if (!/^\d{4}$/.test(v)) return toast("Enter a 4-digit BS year, e.g. 2084.", "error");
              mut((s) => { if (!s.academicYears.includes(v)) s.academicYears.unshift(v); });
              setNewYear("");
            }}>
              <input aria-label="New academic year" value={newYear} onChange={(e) => setNewYear(e.target.value)}
                placeholder="e.g. 2084" inputMode="numeric" className={`${inputCls} max-w-[8rem]`} />
              <Button size="sm" type="submit"><Plus className="h-4 w-4" /> Add</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
