"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import BatchMenu from "@/components/admin/BatchMenu";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText,
  FolderOpen, Pencil, Plus, Trash2, UploadCloud, X,
} from "lucide-react";
import { PageHeader, Card, DataTable, Loading, ErrorNotice, NoResults } from "@/components/admin/ui";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import BSDatePicker from "@/components/ui/BSDatePicker";
import { askConfirm, toast } from "@/components/admin/Feedback";
import type { AcademicSetup } from "@/lib/academics";
import type { BatchPage, BatchWithCount, ExamResult, ResultPage, SubjectDef } from "@/lib/results-shared";
import { csvTemplate, parseCsv, validateCsv, type CsvReport } from "@/lib/results-csv";
import { DEFAULT_SUBJECTS, computeFromMarks } from "@/lib/grading";
import { bsDisplay } from "@/lib/bs-calendar";

const STATUSES = ["Passed", "Failed", "Withheld"] as const;

/* ------------------------------ shared bits ------------------------------ */

const inputCls = "mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 text-sm focus:border-teal-600";
const selectCls = inputCls;

function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-xl2 bg-white p-6 shadow-lift ${wide ? "max-w-3xl" : "max-w-lg"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-lg text-slate2 hover:bg-ivory hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate2">
      <span>Showing {from}–{to} of {total}</span>
      <span className="inline-flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"
          className="grid h-8 w-8 place-items-center rounded-lg border border-mist text-ink disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2">{page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"
          className="grid h-8 w-8 place-items-center rounded-lg border border-mist text-ink disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>
      </span>
    </div>
  );
}

/* ---------------------------- upload wizard ------------------------------ */

type WizardBatch = {
  title: string; class: string; examination_name: string; academic_year: string; description: string;
  subjects: SubjectDef[]; issue_date_bs: string;
};
const emptyWizard: WizardBatch = {
  title: "", class: "", examination_name: "", academic_year: "", description: "",
  subjects: DEFAULT_SUBJECTS.map((x) => ({ ...x })), issue_date_bs: "",
};

/**
 * The batch's marks scheme: subject name, full marks and pass marks. Leave it
 * empty for a GPA-only batch (no marksheet). Edited in the batch forms.
 */
function SubjectsEditor({ value, onChange }: { value: SubjectDef[]; onChange: (v: SubjectDef[]) => void }) {
  const set = (i: number, patch: Partial<SubjectDef>) => onChange(value.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="rounded-xl2 border border-mist bg-ivory/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Subjects &amp; marks scheme</p>
          <p className="mt-0.5 text-xs text-slate2">
            Each student is marked in these subjects; grades, GPA and the marksheet are computed from them. Remove all subjects for a GPA-only batch.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {value.length === 0 && (
            <Button type="button" size="sm" variant="outline" onClick={() => onChange(DEFAULT_SUBJECTS.map((x) => ({ ...x })))}>Use standard subjects</Button>
          )}
          <Button type="button" size="sm" variant="outline" onClick={() => onChange([...value, { name: "", full_marks: 100, pass_marks: 35 }])}>
            <Plus className="h-4 w-4" /> Add subject
          </Button>
        </div>
      </div>
      {value.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-[1fr_84px_84px_32px] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate2">
            <span>Subject</span><span>Full</span><span>Pass</span><span />
          </div>
          {value.map((sub, i) => (
            <div key={i} className="grid grid-cols-[1fr_84px_84px_32px] gap-2">
              <input value={sub.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="e.g. Mathematics"
                className="h-10 rounded-lg border border-mist bg-white px-3 text-sm focus:border-teal-600" />
              <input type="number" min={1} max={1000} value={sub.full_marks} onChange={(e) => set(i, { full_marks: Number(e.target.value) })}
                className="h-10 rounded-lg border border-mist bg-white px-3 text-sm focus:border-teal-600" />
              <input type="number" min={0} max={sub.full_marks} value={sub.pass_marks} onChange={(e) => set(i, { pass_marks: Number(e.target.value) })}
                className="h-10 rounded-lg border border-mist bg-white px-3 text-sm focus:border-teal-600" />
              <button type="button" aria-label="Remove subject" onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="grid h-10 w-8 place-items-center rounded-lg text-slate2 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IssueDateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="text-sm">
      <span className="font-medium text-ink">Marksheet issue date (BS)</span>
      <div className="mt-1"><BSDatePicker value={value} onChange={onChange} /></div>
      <p className="mt-1 text-xs text-slate2">Printed as "Date of Issue" on every marksheet. Leave blank to use the day it is downloaded.</p>
    </div>
  );
}

function UploadWizard({ setup, existing, onClose, onDone }: {
  setup: AcademicSetup;
  /** When launched from a batch row, Step 1 is skipped. */
  existing: BatchWithCount | null;
  onClose: () => void;
  onDone: (batchId: string) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(existing ? 2 : 1);
  const [fields, setFields] = useState<WizardBatch>(emptyWizard);
  const [batch, setBatch] = useState<BatchWithCount | null>(existing);
  const [busy, setBusy] = useState(false);
  const [csvName, setCsvName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [report, setReport] = useState<CsvReport | null>(null);
  const [duplicates, setDuplicates] = useState<number | null>(null);
  const [mode, setMode] = useState<"skip" | "update">("skip");
  const [showIssues, setShowIssues] = useState(false);
  const [done, setDone] = useState<{ inserted: number; updated: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const classes = setup.classes.filter((c) => c.enabled);

  const createBatch = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/results/batches", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not create the result batch.");
      setBatch({ ...body, student_count: 0 });
      setStep(2);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create the result batch.", "error");
    } finally {
      setBusy(false);
    }
  };

  const readFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) return toast("Choose a .csv file.", "error");
    if (file.size > 2 * 1024 * 1024) return toast("The file is larger than 2 MB — split it and try again.", "error");
    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result ?? "");
      const rep = validateCsv(parseCsv(text), batch?.subjects ?? []);
      setCsvName(file.name);
      setCsvText(text);
      setReport(rep);
      setDuplicates(null);
      setShowIssues(false);
      if (!rep.header_ok) {
        toast(`The CSV is missing columns: ${rep.missing_columns.join(", ")}.`, "error");
        return;
      }
      setStep(3);
      if (batch && rep.valid.length > 0) {
        // Ask the server how many of these students already exist in the batch.
        try {
          const res = await fetch("/api/results/import", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batch_id: batch.id, csv: text, mode: "check" }),
          });
          const body = await res.json().catch(() => null);
          if (res.ok && typeof body?.duplicates === "number") setDuplicates(body.duplicates);
        } catch { /* preview still works without the count */ }
      }
    };
    reader.readAsText(file);
  };

  const runImport = async () => {
    if (!batch || !csvText) return;
    setBusy(true);
    try {
      const res = await fetch("/api/results/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batch.id, csv: csvText, mode }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Import failed.");
      setDone(body);
      toast(`${body.inserted} results imported into ${batch.title}.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Import failed.", "error");
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([csvTemplate(batch?.subjects ?? fields.subjects)], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "results-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const batchSummary = batch && (
    <div className="rounded-lg bg-ivory px-4 py-3 text-sm">
      <p className="font-semibold text-ink">{batch.title}</p>
      <p className="mt-0.5 text-slate2">{batch.class} · {batch.examination_name} · Academic Year {batch.academic_year}</p>
      {batch.subjects.length > 0 ? (
        <p className="mt-1 text-xs text-teal-700">Marks scheme: {batch.subjects.map((x) => `${x.name} (${x.full_marks})`).join(", ")} — the CSV needs one column per subject.</p>
      ) : (
        <p className="mt-1 text-xs text-slate2">GPA-only batch — the CSV needs a gpa column.</p>
      )}
    </div>
  );

  /* Success screen */
  if (done && batch) {
    return (
      <Modal title="Results Imported Successfully" onClose={() => onDone(batch.id)}>
        <div className="rounded-xl2 border border-teal-200 bg-teal-50/60 p-5 text-center">
          <p className="text-3xl">✓</p>
          <p className="mt-2 font-semibold text-ink">{batch.title}</p>
          <p className="text-sm text-slate2">{batch.class}</p>
          <p className="mt-3 text-sm text-charcoal">
            {done.inserted} student results imported
            {done.updated > 0 && <>, {done.updated} updated</>}
            {done.skipped > 0 && <>, {done.skipped} duplicates skipped</>}.
          </p>
        </div>
        <p className="mt-3 text-xs text-slate2">The batch stays as a Draft until you publish it, so you can review everything first.</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => onDone(batch.id)}>View Result Batch</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={step === 1 ? "Create Result Batch" : step === 3 ? "Import Preview" : step === 4 ? "Import Results?" : "Upload CSV"}
      onClose={onClose}
      wide={step === 3}
    >
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); createBatch(); }} className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-ink">Result Title *</span>
            <input required minLength={3} value={fields.title}
              onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Annual Examination Result 2082" className={inputCls} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="font-medium text-ink">Class *</span>
              <select required value={fields.class} onChange={(e) => setFields((f) => ({ ...f, class: e.target.value }))} className={selectCls}>
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ink">Examination *</span>
              <select required value={fields.examination_name} onChange={(e) => setFields((f) => ({ ...f, examination_name: e.target.value }))} className={selectCls}>
                <option value="">Select Examination</option>
                {setup.examinations.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ink">Academic Year *</span>
              <select required value={fields.academic_year} onChange={(e) => setFields((f) => ({ ...f, academic_year: e.target.value }))} className={selectCls}>
                <option value="">Select Academic Year</option>
                {setup.academicYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
          </div>
          <SubjectsEditor value={fields.subjects} onChange={(subjects) => setFields((f) => ({ ...f, subjects }))} />
          <IssueDateField value={fields.issue_date_bs} onChange={(issue_date_bs) => setFields((f) => ({ ...f, issue_date_bs }))} />
          <label className="block text-sm">
            <span className="font-medium text-ink">Description</span>
            <textarea rows={2} value={fields.description}
              onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description" className="mt-1 w-full rounded-lg border border-mist bg-white p-3 text-sm focus:border-teal-600" />
          </label>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={busy}>Continue</Button>
          </div>
        </form>
      )}

      {step === 2 && batch && (
        <div className="space-y-4">
          {batchSummary}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); e.dataTransfer.files?.[0] && readFile(e.dataTransfer.files[0]); }}
            className="grid place-items-center rounded-xl2 border-2 border-dashed border-mist bg-ivory/50 px-6 py-10 text-center"
          >
            <FileSpreadsheet className="h-8 w-8 text-teal-600" aria-hidden />
            <p className="mt-3 text-sm font-medium text-ink">Drag &amp; drop your CSV here</p>
            <p className="mt-1 text-xs text-slate2">Columns: student_name, date_of_birth (BS), gpa, result_status, remarks</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
              <Button size="sm" onClick={() => fileRef.current?.click()}><UploadCloud className="h-4 w-4" /> Browse Files</Button>
              <Button size="sm" variant="outline" onClick={downloadTemplate}><Download className="h-4 w-4" /> Download CSV Template</Button>
            </div>
          </div>
          <p className="text-xs text-slate2">
            Dates of birth are <strong>Bikram Sambat</strong> — 2068-04-15 means 15 Shrawan 2068. Class, examination and
            year come from the batch, so the CSV never repeats them.
          </p>
          <div className="flex justify-between gap-3">
            {!existing && <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /> Back</Button>}
            <span />
          </div>
        </div>
      )}

      {step === 3 && batch && report && (
        <div className="space-y-4">
          {batchSummary}
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-lg border border-teal-200 bg-teal-50/60 py-3">
              <p className="text-xl font-bold text-teal-800">{report.valid.length}</p><p className="text-slate2">Valid</p>
            </div>
            <button
              onClick={() => setShowIssues((s) => !s)}
              disabled={report.issues.length === 0}
              className={`rounded-lg border py-3 ${report.issues.length ? "border-sun-300 bg-sun-50 hover:bg-sun-100" : "border-mist bg-ivory/60"}`}
              aria-expanded={showIssues}
            >
              <p className="text-xl font-bold text-ink">{report.issues.length}</p>
              <p className="text-slate2">{report.issues.length ? "Errors — view" : "Errors"}</p>
            </button>
            <div className="rounded-lg border border-mist bg-ivory/60 py-3">
              <p className="text-xl font-bold text-ink">{duplicates ?? "…"}</p><p className="text-slate2">Duplicates</p>
            </div>
          </div>
          <p className="text-xs text-slate2">{csvName} · {report.valid.length + report.issues.length} records found</p>

          {showIssues && report.issues.length > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-sun-300 bg-sun-50/60 p-3 text-sm">
              {report.issues.map((i) => (
                <li key={`${i.row}-${i.problem}`}><span className="font-semibold text-ink">Row {i.row}</span> <span className="text-charcoal">— {i.problem}</span></li>
              ))}
            </ul>
          )}

          {report.valid.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-mist">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-mist bg-ivory/60 text-[11px] uppercase tracking-wider text-slate2">
                    <th className="px-3 py-2 font-semibold">Student</th>
                    <th className="px-3 py-2 font-semibold">DOB (BS)</th>
                    <th className="px-3 py-2 font-semibold">GPA</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {report.valid.slice(0, 5).map((r) => (
                    <tr key={`${r.student_name_normalized}-${r.date_of_birth_bs}`}>
                      <td className="px-3 py-2 font-medium text-ink">{r.student_name}</td>
                      <td className="px-3 py-2 text-charcoal">{r.date_of_birth_bs}</td>
                      <td className="px-3 py-2 text-charcoal">{r.gpa.toFixed(2)}</td>
                      <td className="px-3 py-2 text-charcoal">{r.result_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.valid.length > 5 && (
                <p className="border-t border-mist px-3 py-2 text-xs text-slate2">…and {report.valid.length - 5} more rows</p>
              )}
            </div>
          )}

          {(duplicates ?? 0) > 0 && (
            <div className="rounded-lg border border-sun-300 bg-sun-50/70 p-4 text-sm">
              <p className="font-medium text-ink">{duplicates} of these students already have a result in this batch.</p>
              <div className="mt-2 flex flex-col gap-1.5">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="dupmode" checked={mode === "skip"} onChange={() => setMode("skip")} />
                  <span>Skip duplicates — keep the existing results</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="dupmode" checked={mode === "update"} onChange={() => setMode("update")} />
                  <span>Update existing — replace them with the CSV values</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-3">
            <Button variant="ghost" onClick={() => { setReport(null); setCsvText(""); setStep(2); }}><ArrowLeft className="h-4 w-4" /> Back</Button>
            <Button disabled={report.valid.length === 0} onClick={() => setStep(4)}>Import Results</Button>
          </div>
        </div>
      )}

      {step === 4 && batch && report && (
        <div className="space-y-4">
          <div className="rounded-xl2 border border-mist bg-ivory/60 p-5 text-center">
            <p className="text-2xl font-bold text-ink">{report.valid.length} student results</p>
            <p className="mt-2 font-medium text-ink">{batch.title}</p>
            <p className="text-sm text-slate2">{batch.class} · {batch.examination_name} · Academic Year {batch.academic_year}</p>
            {(duplicates ?? 0) > 0 && (
              <p className="mt-2 text-xs text-slate2">
                {duplicates} duplicates will be {mode === "skip" ? "skipped" : "updated"}.
              </p>
            )}
          </div>
          <div className="flex justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(3)}><ArrowLeft className="h-4 w-4" /> Back</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button loading={busy} onClick={runImport}>Import Results</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* --------------------------- result form modal --------------------------- */

type ResultDraft = {
  student_name: string; date_of_birth_bs: string; roll_number: string; section: string; attendance: string;
  marks: Record<string, string>; gpa: string; result_status: (typeof STATUSES)[number]; remarks: string;
};
const emptyResult: ResultDraft = {
  student_name: "", date_of_birth_bs: "", roll_number: "", section: "", attendance: "", marks: {}, gpa: "", result_status: "Passed", remarks: "",
};
const attendanceText = (r: ExamResult) =>
  r.attendance_present !== null && r.attendance_total !== null ? `${r.attendance_present}/${r.attendance_total}` : "";

function ResultForm({ batch, editing, onClose, onSaved }: {
  batch: BatchWithCount;
  editing: ExamResult | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const scheme = batch.subjects;
  const [draft, setDraft] = useState<ResultDraft>(
    editing
      ? {
          student_name: editing.student_name, date_of_birth_bs: editing.date_of_birth_bs,
          roll_number: editing.roll_number, section: editing.section, attendance: attendanceText(editing),
          marks: Object.fromEntries(scheme.map((x) => [x.name, editing.marks[x.name] === null || editing.marks[x.name] === undefined ? "" : String(editing.marks[x.name])])),
          gpa: String(editing.gpa), result_status: editing.result_status, remarks: editing.remarks,
        }
      : emptyResult
  );
  const [busy, setBusy] = useState(false);

  // Live preview of what the scheme will compute from the marks typed so far.
  const preview = scheme.length
    ? computeFromMarks(scheme, Object.fromEntries(scheme.map((x) => [x.name, draft.marks[x.name] === "" || draft.marks[x.name] === undefined ? null : Number(draft.marks[x.name])])))
    : null;

  const save = async () => {
    setBusy(true);
    try {
      const marks = Object.fromEntries(scheme.map((x) => [x.name, draft.marks[x.name] === "" || draft.marks[x.name] === undefined ? null : Number(draft.marks[x.name])]));
      const payload = {
        ...draft, marks,
        gpa: scheme.length ? (preview?.gpa ?? 0) : Number(draft.gpa),
        result_status: scheme.length && draft.result_status !== "Withheld" ? (preview?.status ?? "Passed") : draft.result_status,
        batch_id: batch.id,
      };
      const res = await fetch(editing ? `/api/results/${editing.id}` : "/api/results", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not save the result.");
      toast(editing ? `Result of ${draft.student_name} saved.` : `Result for ${draft.student_name} added.`);
      onSaved();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save the result.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={editing ? "Edit Examination Result" : "Add Examination Result"} onClose={onClose} wide={scheme.length > 0}>
      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-ink">Student Name *</span>
          <input required minLength={3} value={draft.student_name}
            onChange={(e) => setDraft((d) => ({ ...d, student_name: e.target.value }))}
            placeholder="e.g. Ram Sharma" className={inputCls} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="text-sm">
            <span className="font-medium text-ink">Date of Birth (BS) *</span>
            <div className="mt-1">
              <BSDatePicker required value={draft.date_of_birth_bs} onChange={(v) => setDraft((d) => ({ ...d, date_of_birth_bs: v }))} />
            </div>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-ink">Class</span>
            <input disabled value={batch.class} className={`${inputCls} bg-ivory text-slate2`} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="font-medium text-ink">Roll Number</span>
            <input value={draft.roll_number} onChange={(e) => setDraft((d) => ({ ...d, roll_number: e.target.value }))} placeholder="e.g. 12" className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Section</span>
            <input value={draft.section} onChange={(e) => setDraft((d) => ({ ...d, section: e.target.value }))} placeholder="e.g. A" className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Attendance</span>
            <input value={draft.attendance} onChange={(e) => setDraft((d) => ({ ...d, attendance: e.target.value }))} placeholder="days present/total, e.g. 180/200" className={inputCls} />
          </label>
        </div>

        {scheme.length > 0 ? (
          <div className="rounded-xl2 border border-mist bg-ivory/60 p-4">
            <p className="text-sm font-semibold text-ink">Marks obtained</p>
            <p className="mt-0.5 text-xs text-slate2">Leave a subject blank if the student was absent.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {scheme.map((sub) => (
                <label key={sub.name} className="block text-sm">
                  <span className="font-medium text-ink">{sub.name} <span className="font-normal text-slate2">/ {sub.full_marks}</span></span>
                  <input type="number" step="0.5" min={0} max={sub.full_marks} value={draft.marks[sub.name] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, marks: { ...d.marks, [sub.name]: e.target.value } }))}
                    className={inputCls} />
                </label>
              ))}
            </div>
            {preview && (
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-white p-3 text-center text-sm">
                <div><p className="text-[11px] uppercase tracking-wider text-slate2">Total</p><p className="font-semibold text-ink">{preview.total_obtained} / {preview.total_full}</p></div>
                <div><p className="text-[11px] uppercase tracking-wider text-slate2">GPA</p><p className="font-semibold text-ink">{preview.gpa.toFixed(2)} · {preview.overall_grade}</p></div>
                <div><p className="text-[11px] uppercase tracking-wider text-slate2">Computed result</p><p className={`font-semibold ${preview.status === "Passed" ? "text-teal-700" : "text-red-600"}`}>{preview.status}</p></div>
              </div>
            )}
            <label className="mt-3 block text-sm">
              <span className="font-medium text-ink">Result Status</span>
              <select value={draft.result_status}
                onChange={(e) => setDraft((d) => ({ ...d, result_status: e.target.value as ResultDraft["result_status"] }))}
                className={selectCls}>
                <option value={preview?.status ?? "Passed"}>{preview?.status ?? "Passed"} (computed)</option>
                <option value="Withheld">Withheld</option>
              </select>
            </label>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-ink">GPA *</span>
              <input required type="number" step="0.01" min="0" max="4" value={draft.gpa}
                onChange={(e) => setDraft((d) => ({ ...d, gpa: e.target.value }))}
                placeholder="e.g. 3.65" className={inputCls} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ink">Result Status</span>
              <select value={draft.result_status}
                onChange={(e) => setDraft((d) => ({ ...d, result_status: e.target.value as ResultDraft["result_status"] }))}
                className={selectCls}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
        )}
        <label className="block text-sm">
          <span className="font-medium text-ink">Remarks</span>
          <input value={draft.remarks} onChange={(e) => setDraft((d) => ({ ...d, remarks: e.target.value }))}
            placeholder="e.g. Excellent" className={inputCls} />
        </label>
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>{editing ? "Save Changes" : "Add Result"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------------------- batch edit modal --------------------------- */

function BatchForm({ setup, batch, onClose, onSaved }: {
  setup: AcademicSetup; batch: BatchWithCount; onClose: () => void; onSaved: () => void;
}) {
  const [fields, setFields] = useState<WizardBatch>({
    title: batch.title, class: batch.class, examination_name: batch.examination_name,
    academic_year: batch.academic_year, description: batch.description,
    subjects: batch.subjects.map((x) => ({ ...x })), issue_date_bs: batch.issue_date_bs,
  });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/results/batches/${batch.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not save.");
      toast(`${fields.title} saved.`);
      onSaved();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save.", "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Edit Result Batch" onClose={onClose} wide>
      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-ink">Result Title *</span>
          <input required minLength={3} value={fields.title} onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))} className={inputCls} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="font-medium text-ink">Class *</span>
            <select value={fields.class} onChange={(e) => setFields((f) => ({ ...f, class: e.target.value }))} className={selectCls}>
              {setup.classes.filter((c) => c.enabled || c.name === batch.class).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Examination *</span>
            <select value={fields.examination_name} onChange={(e) => setFields((f) => ({ ...f, examination_name: e.target.value }))} className={selectCls}>
              {setup.examinations.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Academic Year *</span>
            <select value={fields.academic_year} onChange={(e) => setFields((f) => ({ ...f, academic_year: e.target.value }))} className={selectCls}>
              {setup.academicYears.map((y) => <option key={y}>{y}</option>)}
            </select>
          </label>
        </div>
        <SubjectsEditor value={fields.subjects} onChange={(subjects) => setFields((f) => ({ ...f, subjects }))} />
        {batch.student_count > 0 && (
          <p className="text-xs text-amber-700">This batch already has {batch.student_count} results. Renaming or removing a subject drops those marks from the marksheets — adding a subject leaves it blank (absent) until marks are entered.</p>
        )}
        <IssueDateField value={fields.issue_date_bs} onChange={(issue_date_bs) => setFields((f) => ({ ...f, issue_date_bs }))} />
        <label className="block text-sm">
          <span className="font-medium text-ink">Description</span>
          <textarea rows={2} value={fields.description} onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-mist bg-white p-3 text-sm focus:border-teal-600" />
        </label>
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------- main page ------------------------------- */

export default function AdminResults() {
  const [setup, setSetup] = useState<AcademicSetup | null>(null);

  // batch list state
  const [page, setPage] = useState(1);
  const [batches, setBatches] = useState<BatchPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fClass, setFClass] = useState("");
  const [fYear, setFYear] = useState("");
  const [fStatus, setFStatus] = useState("");

  // batch detail state
  const [openBatch, setOpenBatch] = useState<BatchWithCount | null>(null);
  const [rPage, setRPage] = useState(1);
  const [rPageSize, setRPageSize] = useState(25);
  const [rSearch, setRSearch] = useState("");
  const [results, setResults] = useState<ResultPage | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // modals
  const [wizard, setWizard] = useState<{ open: boolean; batch: BatchWithCount | null }>({ open: false, batch: null });
  const [editingBatch, setEditingBatch] = useState<BatchWithCount | null>(null);
  const [resultForm, setResultForm] = useState<{ batch: BatchWithCount; editing: ExamResult | null } | null>(null);

  useEffect(() => {
    fetch(`/api/academics?_=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setSetup)
      .catch(() => toast("Could not load classes and examinations.", "error"));
  }, []);

  const loadBatches = useCallback(async () => {
    setError(null);
    try {
      const p = new URLSearchParams({ page: String(page) });
      if (search) p.set("search", search);
      if (fClass) p.set("class", fClass);
      if (fYear) p.set("year", fYear);
      if (fStatus) p.set("status", fStatus);
      const res = await fetch(`/api/results/batches?${p}`, { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not load result batches.");
      setBatches(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load result batches.");
      setBatches({ rows: [], total: 0 });
    }
  }, [page, search, fClass, fYear, fStatus]);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  // Deep link: /admin/results?batch=<id> opens that batch (used by the marksheet's Back link).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("batch");
    if (!id) return;
    fetch(`/api/results/batches/${id}?page=1&pageSize=25&_=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((body) => { if (body?.batch) { setOpenBatch(body.batch); setResults(body.results); } })
      .catch(() => undefined);
  }, []);

  const loadResults = useCallback(async (batchId: string) => {
    try {
      const p = new URLSearchParams({ page: String(rPage), pageSize: String(rPageSize) });
      if (rSearch) p.set("search", rSearch);
      const res = await fetch(`/api/results/batches/${batchId}?${p}`, { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not load results.");
      setOpenBatch(body.batch);
      setResults(body.results);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load results.", "error");
    }
  }, [rPage, rPageSize, rSearch]);

  useEffect(() => {
    if (openBatch) loadResults(openBatch.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rPage, rPageSize, rSearch]);

  const enterBatch = (b: BatchWithCount) => {
    setOpenBatch(b);
    setResults(null);
    setSelected(new Set());
    setRPage(1);
    setRSearch("");
    loadResults(b.id);
  };

  const togglePublish = async (b: BatchWithCount) => {
    const publish = !b.published;
    if (publish) {
      const ok = await askConfirm({
        title: `Publish ${b.title}?`,
        body: `${b.student_count} results for ${b.class} become findable on the public Results page.`,
        confirmLabel: "Publish",
      });
      if (!ok) return;
    }
    try {
      const res = await fetch(`/api/results/batches/${b.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: publish }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not update.");
      toast(publish ? `${b.title} published.` : `${b.title} unpublished.`);
      loadBatches();
      if (openBatch?.id === b.id) loadResults(b.id);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update.", "error");
    }
  };

  const deleteBatch = async (b: BatchWithCount) => {
    const ok = await askConfirm({
      title: `Delete ${b.title}?`,
      body: `This removes the batch and all ${b.student_count} results inside it. This cannot be undone.`,
      confirmLabel: "Delete Batch",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/results/batches/${b.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not delete.");
      toast(`${b.title} deleted.`);
      if (openBatch?.id === b.id) setOpenBatch(null);
      loadBatches();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete.", "error");
    }
  };

  const deleteRow = async (r: ExamResult) => {
    const ok = await askConfirm({
      title: "Delete this result?",
      body: `${r.student_name} — GPA ${r.gpa.toFixed(2)}. The result is removed from this batch.`,
      confirmLabel: "Delete Result",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/results/${r.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Could not delete.");
      toast(`Result of ${r.student_name} deleted.`);
      if (openBatch) loadResults(openBatch.id);
      loadBatches();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete.", "error");
    }
  };

  const deleteSelected = async () => {
    if (!openBatch || selected.size === 0) return;
    const ok = await askConfirm({
      title: `Delete ${selected.size} selected results?`,
      body: "The selected students are removed from this batch. This cannot be undone.",
      confirmLabel: "Delete Selected",
      danger: true,
    });
    if (!ok) return;
    let failed = 0;
    for (const id of Array.from(selected)) {
      const res = await fetch(`/api/results/${id}`, { method: "DELETE" });
      if (!res.ok) failed++;
    }
    toast(failed === 0 ? `${selected.size} results deleted.` : `${selected.size - failed} deleted, ${failed} failed.`, failed ? "warning" : "success");
    setSelected(new Set());
    loadResults(openBatch.id);
    loadBatches();
  };

  const batchAction = (b: BatchWithCount, action: string) => {
    if (action === "view") enterBatch(b);
    if (action === "edit") setEditingBatch(b);
    if (action === "add") setResultForm({ batch: b, editing: null });
    if (action === "upload") setWizard({ open: true, batch: b });
    if (action === "publish") togglePublish(b);
    if (action === "export") window.open(`/api/results/batches/${b.id}/export`, "_blank");
    if (action === "delete") deleteBatch(b);
  };

  const filterSel = "h-10 rounded-lg border border-mist bg-white px-2.5 text-sm focus:border-teal-600";

  /* ------------------------------ batch view ------------------------------ */
  if (openBatch) {
    const rows = results?.rows ?? [];
    const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
    return (
      <div>
        <button onClick={() => { setOpenBatch(null); setResults(null); loadBatches(); }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800">
          <ArrowLeft className="h-4 w-4" /> All result batches
        </button>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-ink">{openBatch.title}</h1>
            <p className="mt-1 text-sm text-slate2">
              {openBatch.class} · {openBatch.examination_name} · Academic Year {openBatch.academic_year} · {openBatch.student_count} students
            </p>
            <span className="mt-2 inline-block">
              <Badge tone={openBatch.published ? "teal" : "gray"}>{openBatch.published ? "Published" : "Draft"}</Badge>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => window.open(`/api/results/batches/${openBatch.id}/export`, "_blank")}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" variant="outline" onClick={() => setWizard({ open: true, batch: openBatch })}>
              <UploadCloud className="h-4 w-4" /> Upload CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => setResultForm({ batch: openBatch, editing: null })}>
              <Plus className="h-4 w-4" /> Add Result
            </Button>
            <Button size="sm" onClick={() => togglePublish(openBatch)}>
              {openBatch.published ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </div>

        <Card className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <input value={rSearch} onChange={(e) => { setRPage(1); setRSearch(e.target.value); }}
              placeholder="Search student…" className="h-10 w-full max-w-xs rounded-lg border border-mist bg-white px-3 text-sm focus:border-teal-600" />
            <select value={rPageSize} onChange={(e) => { setRPage(1); setRPageSize(Number(e.target.value)); }}
              aria-label="Rows per page" className={filterSel}>
              {[25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
            {selected.size > 0 && (
              <Button size="sm" variant="outline" onClick={deleteSelected} className="!border-red-200 !text-red-600">
                <Trash2 className="h-4 w-4" /> Delete Selected ({selected.size})
              </Button>
            )}
          </div>

          {!results ? (
            <div className="mt-4"><Loading label="Loading results…" /></div>
          ) : rows.length === 0 ? (
            <div className="mt-4">
              <NoResults title="No results in this batch yet" hint="Upload a CSV or add the first result to get started." />
            </div>
          ) : (
            <div className="mt-4">
              <DataTable
                columns={["", "Roll", "Student", "DOB (BS)", "GPA", "Status", "Remarks"]}
                rows={rows.map((r) => [
                  <input key={r.id} type="checkbox" aria-label={`Select ${r.student_name}`} checked={selected.has(r.id)}
                    onChange={(e) => setSelected((s) => { const n = new Set(s); if (e.target.checked) n.add(r.id); else n.delete(r.id); return n; })} />,
                  r.roll_number || "—",
                  r.student_name,
                  bsDisplay(r.date_of_birth_bs),
                  r.gpa.toFixed(2),
                  <Badge key={`${r.id}-s`} tone={r.result_status === "Passed" ? "teal" : r.result_status === "Failed" ? "gray" : "sun"}>{r.result_status}</Badge>,
                  r.remarks || "—",
                ])}
                renderActions={(i) => (
                  <span className="inline-flex items-center gap-1">
                    {openBatch.subjects.length > 0 && (
                      <a aria-label={`Marksheet of ${rows[i].student_name}`} title="Open marksheet" target="_blank" rel="noreferrer"
                        href={`/admin/results/marksheet/${rows[i].id}?batch=${openBatch.id}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate2 hover:bg-ivory hover:text-teal-700"><FileText className="h-4 w-4" /></a>
                    )}
                    <button aria-label={`Edit ${rows[i].student_name}`} onClick={() => setResultForm({ batch: openBatch, editing: rows[i] })}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate2 hover:bg-ivory hover:text-ink"><Pencil className="h-4 w-4" /></button>
                    <button aria-label={`Delete ${rows[i].student_name}`} onClick={() => deleteRow(rows[i])}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate2 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </span>
                )}
              />
              <label className="mt-3 inline-flex items-center gap-2 text-xs text-slate2">
                <input type="checkbox" checked={allChecked}
                  onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} />
                Select all on this page
              </label>
              <Pager page={rPage} pageSize={rPageSize} total={results.total} onPage={setRPage} />
            </div>
          )}
        </Card>

        {wizard.open && setup && (
          <UploadWizard setup={setup} existing={wizard.batch}
            onClose={() => { setWizard({ open: false, batch: null }); loadResults(openBatch.id); loadBatches(); }}
            onDone={(id) => { setWizard({ open: false, batch: null }); loadResults(id); loadBatches(); }} />
        )}
        {editingBatch && setup && (
          <BatchForm setup={setup} batch={editingBatch}
            onClose={() => setEditingBatch(null)}
            onSaved={() => { setEditingBatch(null); loadResults(openBatch.id); loadBatches(); }} />
        )}
        {resultForm && (
          <ResultForm batch={resultForm.batch} editing={resultForm.editing}
            onClose={() => setResultForm(null)}
            onSaved={() => { setResultForm(null); loadResults(openBatch.id); loadBatches(); }} />
        )}
      </div>
    );
  }

  /* ------------------------------ list view ------------------------------ */
  return (
    <div>
      <PageHeader
        title="Examination Results"
        lead="Results are organised into batches — one class, one examination, one academic year. Publish a batch to make it findable on the website."
        action={<Button onClick={() => setWizard({ open: true, batch: null })}><Plus className="h-4 w-4" /> Upload Results</Button>}
      />
      {error && <ErrorNotice message={error} onRetry={loadBatches} />}

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Search result batch…" className="h-10 w-full max-w-xs rounded-lg border border-mist bg-white px-3 text-sm focus:border-teal-600" />
          <select aria-label="Filter by academic year" value={fYear} onChange={(e) => { setPage(1); setFYear(e.target.value); }} className={filterSel}>
            <option value="">Academic Year</option>
            {(setup?.academicYears ?? []).map((y) => <option key={y}>{y}</option>)}
          </select>
          <select aria-label="Filter by class" value={fClass} onChange={(e) => { setPage(1); setFClass(e.target.value); }} className={filterSel}>
            <option value="">Class</option>
            {(setup?.classes ?? []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select aria-label="Filter by status" value={fStatus} onChange={(e) => { setPage(1); setFStatus(e.target.value); }} className={filterSel}>
            <option value="">Status</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </div>

        {!batches ? (
          <div className="mt-4"><Loading label="Loading result batches…" /></div>
        ) : batches.rows.length === 0 ? (
          <div className="mt-4">
            <NoResults title="No result batches found" hint="Upload your first examination result to get started." />
          </div>
        ) : (
          <div className="mt-4">
            <DataTable
              columns={["Result Title", "Class", "Examination", "Year", "Students", "Status"]}
              rows={batches.rows.map((b) => [
                <button key={b.id} onClick={() => enterBatch(b)} className="inline-flex items-center gap-2 text-left font-medium text-ink hover:text-teal-700">
                  <FolderOpen className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />{b.title}
                </button>,
                b.class,
                b.examination_name,
                b.academic_year,
                String(b.student_count),
                <Badge key={`${b.id}-s`} tone={b.published ? "teal" : "gray"}>{b.published ? "Published" : "Draft"}</Badge>,
              ])}
              renderActions={(i) => <BatchMenu title={batches.rows[i].title} published={batches.rows[i].published} onAction={(a) => batchAction(batches.rows[i], a)} />}
            />
            <Pager page={page} pageSize={25} total={batches.total} onPage={setPage} />
          </div>
        )}
      </Card>

      {wizard.open && setup && (
        <UploadWizard setup={setup} existing={wizard.batch}
          onClose={() => { setWizard({ open: false, batch: null }); loadBatches(); }}
          onDone={(id) => {
            setWizard({ open: false, batch: null });
            loadBatches();
            fetch(`/api/results/batches/${id}?page=1&pageSize=25`, { cache: "no-store" })
              .then((r) => r.json())
              .then((body) => { if (body?.batch) { setOpenBatch(body.batch); setResults(body.results); setRPage(1); setRSearch(""); } })
              .catch(() => undefined);
          }} />
      )}
      {editingBatch && setup && (
        <BatchForm setup={setup} batch={editingBatch}
          onClose={() => setEditingBatch(null)}
          onSaved={() => { setEditingBatch(null); loadBatches(); }} />
      )}
      {resultForm && (
        <ResultForm batch={resultForm.batch} editing={resultForm.editing}
          onClose={() => setResultForm(null)}
          onSaved={() => { setResultForm(null); loadBatches(); }} />
      )}
    </div>
  );
}
