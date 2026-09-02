"use client";
import { useState } from "react";
import { KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/admin/Feedback";

/** "Change password" for the signed-in user — opened from the sidebar footer. */
export default function ChangePassword({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (form.next !== form.confirm) return setError("The two new passwords do not match.");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: form.current, next: form.next }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not change the password.");
      toast("Password changed. Use the new one next time you sign in.");
      setOpen(false);
      setForm({ current: "", next: "", confirm: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change the password.");
    } finally {
      setBusy(false);
    }
  };

  const input = "mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 focus:border-teal-600";

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Change password" title="Change password"
        className={compact ? "text-slate2 hover:text-ink" : "flex items-center gap-2 text-sm font-medium text-charcoal hover:text-ink"}>
        <KeyRound className="h-4 w-4" /> {!compact && "Change password"}
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Change password">
          <button aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-md rounded-xl2 border border-mist bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-mist pb-4">
              <h2 className="text-lg font-semibold text-ink">Change password</h2>
              <button onClick={() => setOpen(false)} aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-lg border border-mist text-slate2 hover:border-ink/40 hover:text-ink"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-4 space-y-3 text-sm">
              <label className="block"><span className="font-medium text-ink">Current password</span>
                <input type="password" autoComplete="current-password" required value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} className={input} /></label>
              <label className="block"><span className="font-medium text-ink">New password</span>
                <input type="password" autoComplete="new-password" required minLength={8} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} className={input} /></label>
              <label className="block"><span className="font-medium text-ink">Confirm new password</span>
                <input type="password" autoComplete="new-password" required minLength={8} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={input} /></label>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
              <p className="text-xs text-slate2">At least 8 characters. Forgot your current password? Ask a Super Admin to reset it from Admin → Users.</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" loading={busy}>Change Password</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
