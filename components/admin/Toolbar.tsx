"use client";
import { Search } from "lucide-react";

export default function Toolbar({
  placeholder, filters, active, onFilter, onSearch,
}: {
  placeholder: string;
  filters?: string[];
  active?: string;
  onFilter?: (f: string) => void;
  onSearch?: (q: string) => void;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative block w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate2" aria-hidden />
        <input
          type="search"
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => onSearch?.(e.target.value)}
          className="h-10 w-full rounded-lg border border-mist bg-white pl-10 pr-3.5 text-sm placeholder:text-slate2/70 hover:border-ink/30 focus:border-teal-600"
        />
      </label>
      {filters && (
        <div className="nice-scroll flex gap-1.5 overflow-x-auto">
          {filters.map((f) => (
            <button key={f} onClick={() => onFilter?.(f)} aria-pressed={active === f}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                active === f ? "border-ink bg-ink text-white" : "border-mist bg-white text-charcoal hover:border-ink/40"
              }`}>{f}</button>
          ))}
        </div>
      )}
    </div>
  );
}
