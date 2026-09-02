"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

/**
 * Professional feedback for the CMS, replacing browser alert()/confirm()/prompt():
 *   toast("Saved", "success")            — small auto-dismissing notification
 *   const ok = await askConfirm({...})   — styled confirmation modal (danger-aware)
 *   const name = await askInput({...})   — modal with a single text field
 * <FeedbackHost /> is mounted once in AdminShell and renders everything.
 */

type Kind = "success" | "error" | "info" | "warning";
type Toast = { id: number; kind: Kind; message: string };

type ConfirmRequest = {
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
  input?: { label: string; placeholder?: string; initial?: string };
  resolve: (value: string | boolean | null) => void;
};

let pushToast: ((t: Omit<Toast, "id">) => void) | null = null;
let pushConfirm: ((c: ConfirmRequest) => void) | null = null;

export function toast(message: string, kind: Kind = "success") {
  pushToast?.({ message, kind });
}

export function askConfirm(opts: { title: string; body?: string; confirmLabel?: string; danger?: boolean }) {
  return new Promise<boolean>((resolve) => {
    if (!pushConfirm) return resolve(false);
    pushConfirm({ ...opts, resolve: (v) => resolve(v === true) });
  });
}

export function askInput(opts: { title: string; body?: string; confirmLabel?: string; label: string; placeholder?: string; initial?: string }) {
  return new Promise<string | null>((resolve) => {
    if (!pushConfirm) return resolve(null);
    const { label, placeholder, initial, ...rest } = opts;
    pushConfirm({ ...rest, input: { label, placeholder, initial }, resolve: (v) => resolve(typeof v === "string" ? v : null) });
  });
}

const ICONS: Record<Kind, typeof CheckCircle2> = {
  success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle,
};
const TONES: Record<Kind, string> = {
  success: "border-teal-200 bg-teal-50 text-teal-900",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-mist bg-white text-ink",
  warning: "border-sun-400/60 bg-sun-100/60 text-ink",
};

export default function FeedbackHost() {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setMounted(true);
    let n = 0;
    pushToast = (t) => {
      const id = ++n;
      setToasts((xs) => [...xs, { ...t, id }]);
      window.setTimeout(() => setToasts((xs) => xs.filter((x) => x.id !== id)), 4200);
    };
    pushConfirm = (c) => {
      setInputValue(c.input?.initial ?? "");
      setConfirm(c);
    };
    return () => { pushToast = null; pushConfirm = null; };
  }, []);

  const settle = (value: string | boolean | null) => {
    confirm?.resolve(value);
    setConfirm(null);
  };

  if (!mounted) return null;
  return createPortal(
    <>
      {/* Toasts */}
      <div aria-live="polite" className="fixed bottom-5 right-5 z-[70] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div key={t.id} className={`flex items-start gap-3 rounded-xl2 border p-4 shadow-soft ${TONES[t.kind]}`}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
              <button aria-label="Dismiss" onClick={() => setToasts((xs) => xs.filter((x) => x.id !== t.id))}
                className="rounded p-0.5 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>

      {/* Confirm / input modal */}
      {confirm && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={confirm.title}>
          <button aria-label="Cancel" onClick={() => settle(null)} className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-sm rounded-xl2 border border-mist bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">{confirm.title}</h2>
            {confirm.body && <p className="mt-1.5 text-sm leading-relaxed text-slate2">{confirm.body}</p>}
            {confirm.input && (
              <label className="mt-4 block text-sm">
                <span className="font-medium text-ink">{confirm.input.label}</span>
                <input
                  autoFocus
                  value={inputValue}
                  placeholder={confirm.input.placeholder}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && inputValue.trim()) settle(inputValue.trim()); }}
                  className="mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 focus:border-teal-600"
                />
              </label>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => settle(null)}
                className="rounded-full border border-mist px-4 py-2 text-sm font-medium text-ink hover:border-ink/40">Cancel</button>
              <button
                onClick={() => settle(confirm.input ? inputValue.trim() || null : true)}
                disabled={!!confirm.input && !inputValue.trim()}
                className={`rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  confirm.danger ? "bg-red-600 hover:bg-red-700" : "bg-teal-700 hover:bg-teal-800"
                }`}
              >
                {confirm.confirmLabel ?? (confirm.input ? "Save" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
