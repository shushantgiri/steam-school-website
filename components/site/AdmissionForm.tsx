"use client";
import { useRef, useState } from "react";
import { Check, ChevronLeft, UploadCloud, FileText, X, PartyPopper } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, inputCls } from "@/components/ui/Field";
import { grades } from "@/lib/content";

type Data = {
  studentName: string; dob: string; gender: string; grade: string; prevSchool: string;
  parentName: string; phone: string; email: string; address: string;
};
const empty: Data = { studentName: "", dob: "", gender: "", grade: "", prevSchool: "", parentName: "", phone: "", email: "", address: "" };
const stepNames = ["Student", "Parent / Guardian", "Documents", "Review", "Done"];

export default function AdmissionForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Data, string>>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [refNo, setRefNo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof Data) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setData((d) => ({ ...d, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = (): boolean => {
    const er: typeof errors = {};
    if (step === 0) {
      if (!data.studentName.trim()) er.studentName = "Enter the student's full name.";
      if (!data.dob) er.dob = "Select a date of birth.";
      if (!data.gender) er.gender = "Select an option.";
      if (!data.grade) er.grade = "Select the grade you are applying for.";
    }
    if (step === 1) {
      if (!data.parentName.trim()) er.parentName = "Enter the parent or guardian's name.";
      if (!/^[\d+\-\s]{7,}$/.test(data.phone)) er.phone = "Enter a valid phone number.";
      if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) er.email = "Enter a valid email, or leave this empty.";
      if (!data.address.trim()) er.address = "Enter your home address.";
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => s + 1); };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Upload attached documents first, then submit the application itself.
      const documents: string[] = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("folder", "admissions");
        fd.append("docs", "1");
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const uploaded = await up.json().catch(() => null);
        if (!up.ok) throw new Error(uploaded?.error || "A document failed to upload.");
        documents.push(uploaded.url as string);
      }
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student: data.studentName, grade: data.grade, dob: data.dob,
          previous_school: data.prevSchool, parent: data.parentName,
          phone: data.phone, email: data.email, address: data.address, documents,
        }),
      });
      const saved = await res.json().catch(() => null);
      if (!res.ok) throw new Error(saved?.error || "The application didn't go through.");
      setRefNo(saved.id as string);
      setStep(4);
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "We couldn't submit the application. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((f) => [...f, ...Array.from(list)].slice(0, 6));
  };

  const review: [string, string][] = [
    ["Student name", data.studentName], ["Date of birth", data.dob], ["Gender", data.gender],
    ["Applying grade", data.grade], ["Previous school", data.prevSchool || "—"],
    ["Parent / guardian", data.parentName], ["Phone", data.phone], ["Email", data.email || "—"], ["Address", data.address],
    ["Documents", files.length ? `${files.length} file(s) attached` : "None attached"],
  ];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <ol className="flex items-center gap-2" aria-label="Application progress">
        {stepNames.map((name, i) => (
          <li key={name} className="flex flex-1 flex-col gap-2">
            <span className={`h-1.5 rounded-full transition-colors ${i <= step ? "bg-teal-600" : "bg-mist"}`} />
            <span className={`hidden text-[11px] font-medium sm:block ${i === step ? "text-ink" : "text-slate2"}`}>{name}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-slate2 sm:hidden">Step {Math.min(step + 1, 5)} of 5 · {stepNames[step]}</p>

      <div className="mt-8 rounded-xl2 border border-mist bg-white p-6 shadow-soft sm:p-9">
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-ink">Student information</h2>
            <Field label="Student's full name" error={errors.studentName}>
              <input className={inputCls(!!errors.studentName)} value={data.studentName} onChange={set("studentName")} placeholder="e.g. Aarav Chaudhary" autoComplete="name" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Date of birth" error={errors.dob}>
                <input type="date" className={inputCls(!!errors.dob)} value={data.dob} onChange={set("dob")} />
              </Field>
              <Field label="Gender" error={errors.gender}>
                <select className={inputCls(!!errors.gender)} value={data.gender} onChange={set("gender")}>
                  <option value="">Select…</option><option>Female</option><option>Male</option><option>Other</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Applying for grade" error={errors.grade}>
                <select className={inputCls(!!errors.grade)} value={data.grade} onChange={set("grade")}>
                  <option value="">Select…</option>
                  {grades.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Previous school" hint="Leave empty for Nursery.">
                <input className={inputCls()} value={data.prevSchool} onChange={set("prevSchool")} placeholder="School name, if any" />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-ink">Parent / guardian</h2>
            <Field label="Parent or guardian's full name" error={errors.parentName}>
              <input className={inputCls(!!errors.parentName)} value={data.parentName} onChange={set("parentName")} autoComplete="name" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Phone" error={errors.phone}>
                <input type="tel" className={inputCls(!!errors.phone)} value={data.phone} onChange={set("phone")} placeholder="+977 98…" autoComplete="tel" />
              </Field>
              <Field label="Email" error={errors.email} hint="Optional — we mostly call.">
                <input type="email" className={inputCls(!!errors.email)} value={data.email} onChange={set("email")} autoComplete="email" />
              </Field>
            </div>
            <Field label="Home address" error={errors.address}>
              <input className={inputCls(!!errors.address)} value={data.address} onChange={set("address")} placeholder="Village / tole, municipality, district" autoComplete="street-address" />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-ink">Documents</h2>
            <p className="text-sm text-slate2">
              Attach the birth certificate and, for Grade 1 and above, the previous report card or transfer
              certificate. You can also bring paper copies to the school office instead.
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid w-full place-items-center gap-2 rounded-xl2 border-2 border-dashed border-mist bg-ivory/60 py-10 text-center transition-colors hover:border-teal-600 hover:bg-teal-50/50"
            >
              <UploadCloud className="h-7 w-7 text-teal-600" aria-hidden />
              <span className="text-sm font-medium text-ink">Choose files to attach</span>
              <span className="text-xs text-slate2">PDF or images · up to 6 files</span>
            </button>
            <input ref={fileRef} type="file" multiple accept=".pdf,image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} aria-label="Upload documents" />
            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((f, i) => (
                  <li key={f.name + i} className="flex items-center justify-between gap-3 rounded-lg border border-mist bg-white px-4 py-2.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                      <FileText className="h-4 w-4 shrink-0 text-teal-600" />
                      <span className="truncate">{f.name}</span>
                    </span>
                    <button onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="text-slate2 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-ink">Review your application</h2>
            <p className="mt-1 text-sm text-slate2">Check everything once — you can go back to change any detail.</p>
            <dl className="mt-6 divide-y divide-mist border-y border-mist">
              {review.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 py-3 text-sm">
                  <dt className="text-slate2">{k}</dt>
                  <dd className="font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            {submitError && (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
            )}
          </div>
        )}

        {step === 4 && refNo && (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal-50 text-teal-700">
              <PartyPopper className="h-8 w-8" aria-hidden />
            </span>
            <h2 className="display mt-6 text-2xl sm:text-3xl">Application Submitted Successfully</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate2">
              Thank you, {data.parentName.split(" ")[0]}. Our admissions team will call {data.phone} within three
              working days with the next step.
            </p>
            <div className="mx-auto mt-6 w-fit rounded-xl2 border border-mist bg-ivory px-8 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate2">Application reference</p>
              <p className="mt-1 text-2xl font-bold tracking-wide text-ink">{refNo}</p>
            </div>
            <p className="mt-4 text-xs text-slate2">Please note this number down — quote it when you contact us.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/" variant="outline">Back to Home</ButtonLink>
              <ButtonLink href="/admissions">Read About Next Steps</ButtonLink>
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="mt-8 flex items-center justify-between border-t border-mist pt-6">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={submitting}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : <span />}
            {step < 3 ? (
              <Button onClick={next}>Continue</Button>
            ) : (
              <Button onClick={submit} loading={submitting}>
                {submitting ? "Submitting…" : <>Submit Application <Check className="h-4 w-4" /></>}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
