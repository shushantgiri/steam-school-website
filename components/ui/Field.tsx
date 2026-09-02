"use client";

export function Field({
  label, error, children, hint,
}: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <span className="mt-1 block text-xs text-slate2">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

export const inputCls = (error?: boolean) =>
  `h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-ink placeholder:text-slate2/70 transition-colors ${
    error ? "border-red-400" : "border-mist hover:border-ink/30 focus:border-teal-600"
  }`;
