"use client";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ImagePicker from "@/components/admin/ImagePicker";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "date" | "image";
  options?: string[];
  placeholder?: string;
  help?: string;
  rows?: number;
  /** Span both columns on wide screens. */
  full?: boolean;
  /** For type "image": storage folder (news, events, …). */
  folder?: string;
  /** For type "image": where it appears, e.g. "News → Story cover". */
  location?: string;
  /** For type "image": friendly size guidance, e.g. "1600 × 900 px". */
  recommended?: string;
};

const inputCls =
  "mt-1.5 w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm text-charcoal hover:border-ink/30 focus:border-teal-600";

/**
 * One modal editor shared by News, Notices and Events — the field list decides
 * what it asks for. Values submit as strings; the API normalizes them.
 */
export default function EntryForm({
  title,
  fields,
  initial,
  saving = false,
  error,
  onClose,
  onSubmit,
}: {
  title: string;
  fields: FieldDef[];
  initial?: Record<string, string>;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [f.name, initial?.[f.name] ?? (f.type === "select" ? f.options?.[0] ?? "" : "")])
    )
  );
  const firstField = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-form-title"
        className="relative flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl2 border border-mist bg-paper shadow-lift sm:rounded-xl2"
      >
        <div className="flex items-center justify-between border-b border-mist px-5 py-4">
          <h2 id="entry-form-title" className="text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate2 hover:bg-ivory hover:text-ink"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(values); }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {error && (
              <p role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f, i) =>
                f.type === "image" ? (
                  <div key={f.name} className="sm:col-span-2">
                    <ImagePicker
                      label={f.label}
                      value={values[f.name] ?? ""}
                      onChange={(url) => set(f.name, url)}
                      folder={f.folder ?? "other"}
                      location={f.location ?? "Website"}
                      recommended={f.recommended}
                      successMessage="Image uploaded successfully — remember to press Save."
                    />
                    {f.help && <span className="mt-1 block text-xs text-slate2">{f.help}</span>}
                  </div>
                ) : (
                <label key={f.name} className={`block text-sm ${f.full ? "sm:col-span-2" : ""}`}>
                  <span className="font-medium text-ink">{f.label}</span>
                  {f.type === "textarea" ? (
                    <textarea
                      ref={i === 0 ? (firstField as React.RefObject<HTMLTextAreaElement>) : undefined}
                      rows={f.rows ?? 4}
                      value={values[f.name] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.name, e.target.value)}
                      className={inputCls}
                    />
                  ) : f.type === "select" ? (
                    <select
                      ref={i === 0 ? (firstField as React.RefObject<HTMLSelectElement>) : undefined}
                      value={values[f.name] ?? ""}
                      onChange={(e) => set(f.name, e.target.value)}
                      className={`${inputCls} h-10 py-0`}
                    >
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      ref={i === 0 ? (firstField as React.RefObject<HTMLInputElement>) : undefined}
                      type={f.type === "date" ? "date" : "text"}
                      value={values[f.name] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.name, e.target.value)}
                      className={`${inputCls} h-10 py-0`}
                    />
                  )}
                  {f.help && <span className="mt-1 block text-xs text-slate2">{f.help}</span>}
                </label>
                )
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-mist bg-white px-5 py-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" loading={saving} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
