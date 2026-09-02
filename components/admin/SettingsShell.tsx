"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { PageHeader, Loading, ErrorNotice } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/admin/Feedback";
import { api } from "@/lib/client-api";
import type { SiteSettings } from "@/lib/types";

/** The settings areas, each on its own page. */
export const SETTINGS_TABS = [
  { href: "/admin/settings", label: "General" },
  { href: "/admin/settings/seo", label: "SEO & Sharing" },
  { href: "/admin/settings/social", label: "Social Media" },
  { href: "/admin/settings/documents", label: "Marksheets" },
  { href: "/admin/settings/error-pages", label: "Error Pages" },
  { href: "/admin/settings/maintenance", label: "Maintenance Mode" },
  { href: "/admin/settings/security", label: "Security" },
];

/**
 * Shared frame for every settings page: title, tabs, load/save of the one
 * settings document, and a Save button with success/error feedback.
 * Children receive the current settings and a setter.
 */
export default function SettingsShell({ title, lead, children, saveLabel = "Save Changes" }: {
  title: string;
  lead: string;
  saveLabel?: string;
  children: (s: SiteSettings, set: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void) => React.ReactNode;
}) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setError(null);
    try { setSettings(await api.get<SiteSettings>("/api/settings")); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load settings."); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      setSettings(await api.put<SiteSettings>("/api/settings", settings));
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      toast("Settings saved — changes are live on the website.");
    } catch (e) { toast(e instanceof Error ? e.message : "Could not save.", "error"); }
    finally { setSaving(false); }
  };

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setSettings((s) => (s ? { ...s, [key]: value } : s));

  return (
    <div>
      <PageHeader title={title} lead={lead}
        action={<Button loading={saving} onClick={save}>{saved ? <><Check className="h-4 w-4" /> Saved</> : saveLabel}</Button>} />
      <nav className="-mx-1 mb-6 overflow-x-auto" aria-label="Settings sections">
        <div className="flex w-max gap-1 px-1">
          {SETTINGS_TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link key={t.href} href={t.href}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-ink text-white" : "text-charcoal hover:bg-ivory"}`}>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
      {error && <ErrorNotice message={error} onRetry={load} />}
      {!settings ? <Loading label="Loading settings…" /> : <div className="max-w-3xl space-y-6">{children(settings, set)}</div>}
    </div>
  );
}

/* ---- small shared inputs used by the settings pages ---- */
const cls = "mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 text-sm focus:border-teal-600";

export function Field({ label, value, onChange, help, type = "text" }: { label: string; value: string; onChange: (v: string) => void; help?: string; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      {help && <span className="mt-1 block text-xs text-slate2">{help}</span>}
    </label>
  );
}

export function TextArea({ label, value, onChange, help, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; help?: string; rows?: number }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-mist bg-white p-3 text-sm focus:border-teal-600" />
      {help && <span className="mt-1 block text-xs text-slate2">{help}</span>}
    </label>
  );
}

export function ImageField({ label, value, onChange, help, folder = "logo" }: { label: string; value: string; onChange: (v: string) => void; help?: string; folder?: string }) {
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Upload failed.");
      onChange(body.url); toast("Image uploaded — remember to Save Changes.");
    } catch (e) { toast(e instanceof Error ? e.message : "Upload failed.", "error"); }
    finally { setBusy(false); }
  };
  return (
    <div className="text-sm">
      <span className="font-medium text-ink">{label}</span>
      <div className="mt-1 flex items-start gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-mist bg-ivory">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className="h-full w-full object-contain" /> : <span className="grid h-full place-items-center text-[11px] text-slate2">Not set</span>}
        </div>
        <div className="flex-1">
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste an image link, or upload →" className={cls} />
          <div className="mt-2 flex gap-2">
            <label className="inline-flex cursor-pointer items-center rounded-full border border-mist bg-white px-4 py-1.5 text-sm font-medium hover:bg-ivory">
              {busy ? "Uploading…" : "Upload"} <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            {value && <button type="button" onClick={() => onChange("")} className="rounded-full px-3 py-1.5 text-sm text-slate2 hover:text-red-600">Remove</button>}
          </div>
        </div>
      </div>
      {help && <span className="mt-1 block text-xs text-slate2">{help}</span>}
    </div>
  );
}

export function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl2 border border-mist bg-white p-4">
      <span>
        <span className="block font-medium text-ink">{label}</span>
        {help && <span className="mt-0.5 block text-xs text-slate2">{help}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0 items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-7 w-12 rounded-full bg-mist transition peer-checked:bg-teal-600" />
        <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        <span className="ml-3 text-sm font-semibold text-ink">{checked ? "ON" : "OFF"}</span>
      </span>
    </label>
  );
}
