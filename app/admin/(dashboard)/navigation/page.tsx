"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { PageHeader, Card, Loading, ErrorNotice } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { askConfirm, toast } from "@/components/admin/Feedback";
import type { NavEntry, NavLink, Navigation } from "@/lib/navigation";

const nid = () => crypto.randomUUID();
const inputCls = "h-10 w-full rounded-lg border border-mist bg-white px-3 text-sm focus:border-teal-600";

/**
 * Edits the public website's menu: reorder, rename, enable/disable, and turn
 * any item into a dropdown by adding submenu links. Changes are live on the
 * website after Save.
 */
export default function AdminNavigation() {
  const [nav, setNav] = useState<Navigation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/navigation?_=${Date.now()}`, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setNav)
      .catch(() => setError("Could not load the navigation."));
  }, []);

  const save = async () => {
    if (!nav) return;
    setSaving(true);
    try {
      const res = await fetch("/api/navigation", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nav),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not save.");
      setNav(body);
      toast("Navigation saved — it's live on the website.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save.", "error");
    } finally {
      setSaving(false);
    }
  };

  const update = (fn: (items: NavEntry[]) => NavEntry[]) =>
    setNav((n) => (n ? { items: fn(structuredClone(n.items)) } : n));

  const moveItem = (i: number, d: number) =>
    update((items) => {
      const j = i + d;
      if (j < 0 || j >= items.length) return items;
      [items[i], items[j]] = [items[j], items[i]];
      return items;
    });

  const moveChild = (i: number, ci: number, d: number) =>
    update((items) => {
      const kids = items[i].children;
      const j = ci + d;
      if (j < 0 || j >= kids.length) return items;
      [kids[ci], kids[j]] = [kids[j], kids[ci]];
      return items;
    });

  const removeItem = async (i: number) => {
    if (!nav) return;
    const item = nav.items[i];
    const ok = await askConfirm({
      title: `Remove "${item.label}" from the menu?`,
      body: item.children.length ? "Its submenu links are removed with it." : undefined,
      confirmLabel: "Remove",
      danger: true,
    });
    if (ok) update((items) => items.filter((_, idx) => idx !== i));
  };

  if (error) return <ErrorNotice message={error} />;
  if (!nav) return <Loading label="Loading navigation…" />;

  return (
    <div>
      <PageHeader
        title="Navigation"
        lead="The public website's menu. Items with submenu links appear as dropdowns; disabled items stay here but never show on the site."
        action={<Button loading={saving} onClick={save}>Save Changes</Button>}
      />
      <div className="space-y-4">
        {nav.items.map((item, i) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex shrink-0 flex-col gap-1">
                <button aria-label="Move up" onClick={() => moveItem(i, -1)} disabled={i === 0}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-mist text-slate2 hover:text-ink disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button aria-label="Move down" onClick={() => moveItem(i, 1)} disabled={i === nav.items.length - 1}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-mist text-slate2 hover:text-ink disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              </div>
              <input aria-label="Label" value={item.label}
                onChange={(e) => update((items) => { items[i].label = e.target.value; return items; })}
                className={`${inputCls} max-w-[12rem] font-medium`} />
              <input aria-label="Link" value={item.href}
                onChange={(e) => update((items) => { items[i].href = e.target.value; return items; })}
                placeholder="/about" className={`${inputCls} max-w-[14rem]`} />
              <label className="inline-flex items-center gap-2 text-sm text-charcoal">
                <input type="checkbox" checked={item.enabled}
                  onChange={(e) => update((items) => { items[i].enabled = e.target.checked; return items; })} />
                Show on website
              </label>
              <button aria-label={`Remove ${item.label}`} onClick={() => removeItem(i)}
                className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-slate2 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>

            {/* Submenu */}
            <div className="mt-4 space-y-2 border-t border-mist pt-4">
              {item.children.map((c: NavLink, ci: number) => (
                <div key={c.id} className="flex flex-wrap items-center gap-2 pl-6">
                  <span className="text-slate2">↳</span>
                  <button aria-label="Move up" onClick={() => moveChild(i, ci, -1)} disabled={ci === 0}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-mist text-slate2 hover:text-ink disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button aria-label="Move down" onClick={() => moveChild(i, ci, 1)} disabled={ci === item.children.length - 1}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-mist text-slate2 hover:text-ink disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                  <input aria-label="Submenu label" value={c.label}
                    onChange={(e) => update((items) => { items[i].children[ci].label = e.target.value; return items; })}
                    className={`${inputCls} max-w-[11rem]`} />
                  <input aria-label="Submenu link" value={c.href}
                    onChange={(e) => update((items) => { items[i].children[ci].href = e.target.value; return items; })}
                    className={`${inputCls} max-w-[13rem]`} />
                  <label className="inline-flex items-center gap-2 text-sm text-charcoal">
                    <input type="checkbox" checked={c.enabled}
                      onChange={(e) => update((items) => { items[i].children[ci].enabled = e.target.checked; return items; })} />
                    Show
                  </label>
                  <button aria-label={`Remove ${c.label}`}
                    onClick={() => update((items) => { items[i].children = items[i].children.filter((_, x) => x !== ci); return items; })}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate2 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <div className="pl-6">
                <Button size="sm" variant="ghost"
                  onClick={() => update((items) => { items[i].children.push({ id: nid(), label: "New link", href: "/", enabled: true }); return items; })}>
                  <Plus className="h-4 w-4" /> Add submenu link
                </Button>
              </div>
            </div>
          </Card>
        ))}
        <Button variant="outline"
          onClick={() => update((items) => { items.push({ id: nid(), label: "New item", href: "/", enabled: true, children: [] }); return items; })}>
          <Plus className="h-4 w-4" /> Add navigation item
        </Button>
      </div>
    </div>
  );
}
