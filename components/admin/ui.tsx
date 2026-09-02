import Link from "next/link";
import { AlertCircle, Loader2, SearchX } from "lucide-react";
import Badge, { statusTone } from "@/components/ui/Badge";

export function PageHeader({
  title, lead, action,
}: { title: string; lead?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {lead && <p className="mt-1 text-sm text-slate2">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, action, children, className = "", id }: {
  title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string;
}) {
  return (
    <section id={id} className={`rounded-xl2 border border-mist bg-white p-5 shadow-soft sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate2">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Desktop table that collapses into stacked cards on mobile. */
export function DataTable({
  columns, rows, renderActions,
}: {
  columns: string[];
  rows: (string | React.ReactNode)[][];
  renderActions?: (rowIndex: number) => React.ReactNode;
}) {
  return (
    <div>
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-mist text-[11px] uppercase tracking-wider text-slate2">
              {columns.map((c) => <th key={c} className="py-3 pr-4 font-semibold">{c}</th>)}
              {renderActions && <th className="py-3 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-mist">
            {rows.map((r, i) => (
              <tr key={i} className="group hover:bg-ivory/50">
                {r.map((cell, j) => (
                  <td key={j} className={`py-3.5 pr-4 ${j === 0 ? "font-medium text-ink" : "text-charcoal"}`}>{cell}</td>
                ))}
                {renderActions && <td className="py-3.5 text-right">{renderActions(i)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((r, i) => (
          <li key={i} className="rounded-lg border border-mist bg-white p-4">
            <div className="font-medium text-ink">{r[0]}</div>
            <dl className="mt-2 space-y-1.5">
              {r.slice(1).map((cell, j) => (
                <div key={j} className="flex justify-between gap-4 text-sm">
                  <dt className="text-slate2">{columns[j + 1]}</dt>
                  <dd className="text-right text-charcoal">{cell}</dd>
                </div>
              ))}
            </dl>
            {renderActions && <div className="mt-3 border-t border-mist pt-3 text-right">{renderActions(i)}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <div role="status" className="grid place-items-center py-16 text-center text-slate2">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <p role="alert" className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {message}
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline underline-offset-2">Try again</button>
      )}
    </p>
  );
}

export function NoResults({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="grid place-items-center py-16 text-center">
      <SearchX className="h-7 w-7 text-slate2" aria-hidden />
      <p className="mt-3 font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-slate2">{hint}</p>
    </div>
  );
}

export function Status({ value }: { value: string }) {
  return <Badge tone={statusTone(value)}>{value}</Badge>;
}

export function QuickAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg border border-mist bg-white px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-teal-600 hover:bg-teal-50/40">
      {children}
    </Link>
  );
}
