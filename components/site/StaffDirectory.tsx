"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { GraduationCap, Search, User, X } from "lucide-react";
import { STAFF_CATEGORIES, STAFF_CATEGORY_LABELS, type StaffCategory, type StaffMember } from "@/lib/staff-shared";

/**
 * The staff directory. Compact cards in a 2 / 3 / 4-column grid (phone /
 * tablet / desktop) so 25+ people fit without endless scrolling; tapping a
 * card opens the full profile in a modal. Filter tabs and a name search
 * narrow the list. Photos share one aspect ratio with faces anchored to the
 * top, so no card is taller than its neighbour.
 */
export default function StaffDirectory({ staff }: { staff: StaffMember[] }) {
  const [filter, setFilter] = useState<"All" | StaffCategory>("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<StaffMember | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: staff.length };
    for (const cat of STAFF_CATEGORIES) c[cat] = staff.filter((m) => m.category === cat).length;
    return c;
  }, [staff]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return staff.filter(
      (m) =>
        (filter === "All" || m.category === filter) &&
        (!needle || `${m.name} ${m.designation} ${m.subjects}`.toLowerCase().includes(needle))
    );
  }, [staff, filter, q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const tabs: Array<["All" | StaffCategory, string]> = [["All", "All"], ...STAFF_CATEGORIES.map((c) => [c, STAFF_CATEGORY_LABELS[c]] as ["All" | StaffCategory, string])];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2">
            {tabs.map(([key, label]) =>
              key === "All" || counts[key] > 0 ? (
                <button key={key} onClick={() => setFilter(key)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${filter === key ? "bg-ink text-white" : "border border-mist bg-white text-charcoal hover:bg-ivory"}`}>
                  {label} <span className={filter === key ? "text-white/60" : "text-slate2"}>{counts[key]}</span>
                </button>
              ) : null
            )}
          </div>
        </div>
        <label className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or subject" aria-label="Search staff"
            className="h-11 w-full rounded-full border border-mist bg-white pl-10 pr-4 text-sm focus:border-teal-600" />
        </label>
      </div>

      {/* Grid */}
      {shown.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate2">No one matches that search.</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {shown.map((m) => (
            <li key={m.id}>
              <button onClick={() => setOpen(m)} className="group block w-full overflow-hidden rounded-xl2 border border-mist bg-white text-left transition hover:-translate-y-0.5 hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                <div className="relative aspect-[4/5] bg-ivory">
                  {m.photo ? (
                    <Image src={m.photo} alt={m.name} fill sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 48vw" className="object-cover object-top" />
                  ) : (
                    <div className="grid h-full place-items-center text-slate2"><User className="h-10 w-10" /></div>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="line-clamp-1 text-sm font-semibold text-ink sm:text-base">{m.name}</h3>
                  <p className="line-clamp-1 text-xs text-teal-700 sm:text-sm">{m.designation}</p>
                  {m.subjects && <p className="mt-0.5 line-clamp-1 text-[11px] text-slate2 sm:text-xs">{m.subjects}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Profile modal */}
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="staff-name">
          <button aria-label="Close" onClick={() => setOpen(null)} className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl2 bg-white shadow-lift">
            <button onClick={() => setOpen(null)} aria-label="Close profile"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-soft hover:bg-white"><X className="h-5 w-5" /></button>
            <div className="grid sm:grid-cols-[14rem_1fr]">
              <div className="relative aspect-[4/5] bg-ivory sm:aspect-auto sm:min-h-[22rem]">
                {open.photo ? (
                  <Image src={open.photo} alt={open.name} fill sizes="(min-width:640px) 14rem, 100vw" className="object-cover object-top" />
                ) : (
                  <div className="grid h-full place-items-center text-slate2"><User className="h-16 w-16" /></div>
                )}
              </div>
              <div className="p-6 sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">{STAFF_CATEGORY_LABELS[open.category]}</p>
                <h2 id="staff-name" className="mt-1 text-2xl font-semibold text-ink">{open.name}</h2>
                <p className="mt-1 text-base text-charcoal">{open.designation}</p>
                {open.subjects && <p className="mt-0.5 text-sm text-slate2">{open.subjects}</p>}
                {open.qualification && (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-ivory px-3 py-1.5 text-sm text-charcoal"><GraduationCap className="h-4 w-4 text-teal-700" /> {open.qualification}</p>
                )}
                {open.bio ? (
                  <p className="mt-4 text-sm leading-relaxed text-charcoal">{open.bio}</p>
                ) : (
                  <p className="mt-4 text-sm text-slate2">Profile details coming soon.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
