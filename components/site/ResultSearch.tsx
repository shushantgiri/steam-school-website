"use client";
import { useEffect, useRef, useState } from "react";
import { Download, FileText, Printer, RotateCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import BSDatePicker from "@/components/ui/BSDatePicker";
import { bsDisplay } from "@/lib/bs-calendar";

type PublicResult = {
  student_name: string;
  date_of_birth_bs: string;
  class: string;
  section: string;
  roll_number: string;
  gpa: number;
  result_status: "Passed" | "Failed" | "Withheld";
  remarks: string;
  batch_title: string;
  examination_name: string;
  academic_year: string;
  has_marksheet: boolean;
  subjects: Array<{ name: string; full_marks: number; obtained: number | null; grade: string; point: number }>;
  percentage: number | null;
  /** Signed links to the official marksheet; null for GPA-only batches. */
  marksheet: { view: string; pdf: string } | null;
};

/**
 * The family-facing result lookup. Requires exact details on purpose —
 * results are private, so browsing or guessing must stay impractical. A
 * successful search opens the celebration modal immediately (no scrolling),
 * with a gentle sparkle entrance that switches to a plain fade under
 * prefers-reduced-motion.
 */
export default function ResultSearch({ classes, years, schoolName }: {
  classes: string[];
  years: string[];
  schoolName: string;
}) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [klass, setKlass] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [result, setResult] = useState<PublicResult | null>(null);
  const [full, setFull] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotFound(false);
    setResult(null);
    setFull(false);
    try {
      const res = await fetch("/api/results/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dob, class: klass, year: year || undefined }),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error(body?.error || "Search failed — try again.");
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  const searchAgain = () => { setResult(null); setFull(false); };

  const selectCls = "mt-1 h-12 w-full rounded-lg border border-mist bg-white px-3 text-sm focus:border-teal-600";

  return (
    <div>
      <form onSubmit={search} className="rounded-xl2 border border-mist bg-white p-6 shadow-soft sm:p-8">
        <h2 className="text-lg font-semibold text-ink">Find Your Examination Result</h2>
        <label className="mt-5 block text-sm">
          <span className="font-medium text-ink">Student&apos;s full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={3}
            placeholder="e.g. Ram Sharma" autoComplete="name" inputMode="text"
            className="mt-1 h-12 w-full rounded-lg border border-mist bg-white px-3 focus:border-teal-600" />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="text-sm">
            <span className="font-medium text-ink">Date of birth (BS)</span>
            <div className="mt-1">
              <BSDatePicker required value={dob} onChange={setDob} placeholder="Select date of birth" />
            </div>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-ink">Class</span>
            <select value={klass} onChange={(e) => setKlass(e.target.value)} required className={selectCls}>
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm">
          <span className="font-medium text-ink">Academic year <span className="font-normal text-slate2">(optional)</span></span>
          <select value={year} onChange={(e) => setYear(e.target.value)} className={selectCls}>
            <option value="">Any year — newest first</option>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
        </label>
        <Button type="submit" loading={busy} className="mt-6 w-full" size="lg">
          <Search className="h-4 w-4" /> {busy ? "Checking your result..." : "Check Result"}
        </Button>
      </form>

      {error && (
        <p role="alert" className="mt-5 rounded-xl2 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      )}

      {notFound && (
        <div role="alert" className="mt-5 rounded-xl2 border border-mist bg-ivory/70 p-5 text-sm">
          <p className="font-medium text-ink">We couldn&apos;t find a matching result.</p>
          <p className="mt-2 text-charcoal">Please check:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-charcoal">
            <li>Student name — spelled exactly as registered</li>
            <li>Date of birth — in Bikram Sambat</li>
            <li>Class</li>
            <li>Academic year</li>
          </ul>
          <p className="mt-3 text-xs text-slate2">Results appear here only after the school publishes them.</p>
        </div>
      )}

      {result && (
        <CelebrationModal
          result={result}
          full={full}
          onFull={() => setFull(true)}
          onClose={searchAgain}
          schoolName={schoolName}
        />
      )}
    </div>
  );
}

/* --------------------------- celebration modal --------------------------- */

/** Deterministic pseudo-random so the server and client agree. */
const seeded = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function Sparkles() {
  // Two gentle waves — left → centre and right → centre.
  const marks = ["✦", "✧", "✨", "·"];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
      {Array.from({ length: 14 }, (_, i) => {
        const fromLeft = i % 2 === 0;
        const top = 6 + seeded(i, 1) * 82;
        const delay = seeded(i, 2) * 500;
        const size = 10 + seeded(i, 3) * 10;
        return (
          <span
            key={i}
            className={`absolute select-none text-sun-400 ${fromLeft ? "sparkle-left" : "sparkle-right"}`}
            style={{
              top: `${top}%`,
              [fromLeft ? "left" : "right"]: "-8%",
              fontSize: `${size}px`,
              animationDelay: `${delay}ms`,
            } as React.CSSProperties}
          >
            {marks[i % marks.length]}
          </span>
        );
      })}
    </div>
  );
}

function CelebrationModal({ result, full, onFull, onClose, schoolName }: {
  result: PublicResult;
  full: boolean;
  onFull: () => void;
  onClose: () => void;
  schoolName: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.body.classList.add("result-print");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.classList.remove("result-print");
    };
  }, [onClose]);

  const passed = result.result_status === "Passed";
  const tone = passed ? "teal" : result.result_status === "Failed" ? "gray" : "sun";

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4 print:static print:block print:p-0" role="dialog" aria-modal="true" aria-label="Examination result">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] print:hidden" onClick={onClose} />
      {!full && <Sparkles />}

      <div className="celebrate-card relative w-full max-w-md rounded-xl2 bg-white p-6 text-center shadow-lift sm:p-8 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-slate2 hover:bg-ivory hover:text-ink print:hidden"
        >
          <X className="h-4 w-4" />
        </button>

        {!full ? (
          <>
            <p aria-hidden className="celebrate-step text-2xl" style={{ animationDelay: "150ms" }}>✨ 🎉 ✨</p>
            <h2 className="celebrate-step mt-2 text-2xl font-extrabold tracking-tight text-ink" style={{ animationDelay: "250ms" }}>
              {passed ? "Congratulations!" : "Your Result"}
            </h2>
            <p className="celebrate-step mt-3 text-lg font-semibold text-ink" style={{ animationDelay: "450ms" }}>{result.student_name}</p>
            <p className="celebrate-step text-sm text-slate2" style={{ animationDelay: "450ms" }}>{result.class}</p>

            <div className="celebrate-step mt-5" style={{ animationDelay: "650ms" }}>
              <p className="text-6xl font-extrabold tracking-tight text-teal-700">{result.gpa.toFixed(2)}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate2">GPA</p>
            </div>

            <div className="celebrate-step mt-4" style={{ animationDelay: "800ms" }}>
              <Badge tone={tone}>{passed ? "✓ " : ""}{result.result_status}</Badge>
            </div>

            <p className="celebrate-step mt-4 text-sm text-charcoal" style={{ animationDelay: "900ms" }}>
              {result.batch_title}
              <span className="block text-xs text-slate2">Academic Year {result.academic_year}</span>
            </p>

            <div className="celebrate-step mt-6 grid gap-2" style={{ animationDelay: "1000ms" }}>
              {result.marksheet ? (
                <>
                  <a href={result.marksheet.view}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-teal-600">
                    <FileText className="h-4 w-4" /> View Marksheet
                  </a>
                </>
              ) : (
                <Button onClick={onFull} className="w-full">View Full Result</Button>
              )}
              <Button variant="outline" onClick={onClose} className="w-full"><RotateCcw className="h-4 w-4" /> Search Again</Button>
            </div>
          </>
        ) : (
          <div className="text-left">
            <div className="border-b border-mist pb-4 text-center print:border-ink/30">
              <p className="text-lg font-bold text-ink">{schoolName}</p>
              <p className="text-xs text-slate2">Deukhuri, Dang · Lumbini Province, Nepal</p>
              <p className="mt-3 text-sm font-semibold text-ink">{result.batch_title}</p>
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              {[
                ["Student Name", result.student_name],
                ["Date of Birth (BS)", bsDisplay(result.date_of_birth_bs)],
                ["Class", result.class + (result.section && result.section !== "—" ? ` · Section ${result.section}` : "")],
                ...(result.roll_number ? [["Roll Number", result.roll_number]] : []),
                ["Examination", result.examination_name],
                ["Academic Year", `${result.academic_year} BS`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-slate2">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
              {result.has_marksheet && result.subjects.length > 0 && (
                <div className="border-t border-mist pt-2.5">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-slate2">
                        <th className="pb-1 font-medium">Subject</th>
                        <th className="pb-1 text-right font-medium">Marks</th>
                        <th className="pb-1 text-right font-medium">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.subjects.map((sub) => (
                        <tr key={sub.name} className="border-t border-mist/60">
                          <td className="py-1.5 text-ink">{sub.name}</td>
                          <td className="py-1.5 text-right font-medium text-ink">{sub.obtained === null ? "AB" : sub.obtained} <span className="text-slate2">/ {sub.full_marks}</span></td>
                          <td className="py-1.5 text-right font-semibold text-ink">{sub.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.percentage !== null && (
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-slate2">Percentage</span>
                      <span className="font-semibold text-ink">{result.percentage.toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-mist pt-2.5">
                <dt className="text-slate2">GPA</dt>
                <dd className="text-right text-2xl font-extrabold text-teal-700">{result.gpa.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate2">Result</dt>
                <dd className="text-right"><Badge tone={tone}>{result.result_status}</Badge></dd>
              </div>
              {result.remarks && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate2">Remarks</dt>
                  <dd className="text-right font-medium text-ink">{result.remarks}</dd>
                </div>
              )}
            </dl>
            <p className="mt-4 border-t border-mist pt-3 text-xs text-slate2">
              {result.marksheet
                ? "The official grade sheet is available below as a print-ready A4 PDF."
                : "This is an online summary. For an official marksheet, please contact the school office."}
            </p>
            <div className="mt-5 grid gap-2 print:hidden">
              {result.marksheet && (
                <>
                  <a href={result.marksheet.pdf} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-600">
                    <Download className="h-4 w-4" /> Download Marksheet (PDF)
                  </a>
                  <a href={result.marksheet.view} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-mist bg-white px-5 py-3 text-sm font-medium text-ink hover:bg-ivory">
                    <FileText className="h-4 w-4" /> View Marksheet
                  </a>
                </>
              )}
              <Button variant={result.marksheet ? "outline" : "primary"} onClick={() => window.print()} className="w-full"><Printer className="h-4 w-4" /> Print Summary</Button>
              <Button variant="outline" onClick={onClose} className="w-full"><RotateCcw className="h-4 w-4" /> Search Again</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
