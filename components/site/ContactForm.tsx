"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, inputCls } from "@/components/ui/Field";

export default function ContactForm() {
  const [d, setD] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setD((v) => ({ ...v, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  const submit = async () => {
    const er: Record<string, string> = {};
    if (!d.name.trim()) er.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(d.email)) er.email = "Enter a valid email address.";
    if (!d.subject.trim()) er.subject = "Enter a subject.";
    if (d.message.trim().length < 10) er.message = "Write at least a sentence so we can help properly.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setState("sending");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.name, email: d.email, phone: d.phone ?? "",
          subject: d.subject ?? "Website enquiry", body: d.message,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "The message didn't send.");
      }
      setState("sent");
    } catch (err) {
      setState("idle");
      setErrors((er) => ({ ...er, message: err instanceof Error ? err.message : "The message didn't send — try again." }));
    }
  };

  if (state === "sent") {
    return (
      <div className="grid place-items-center rounded-xl2 border border-mist bg-white py-16 text-center shadow-soft">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-teal-50 text-teal-700"><Check className="h-7 w-7" /></span>
        <h3 className="mt-5 text-xl font-semibold text-ink">Message sent</h3>
        <p className="mt-2 max-w-sm px-6 text-sm text-slate2">
          Thank you, {d.name.split(" ")[0]}. We reply to every message within one school day.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl2 border border-mist bg-white p-6 shadow-soft sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" error={errors.name}><input className={inputCls(!!errors.name)} value={d.name} onChange={set("name")} autoComplete="name" /></Field>
        <Field label="Email" error={errors.email}><input type="email" className={inputCls(!!errors.email)} value={d.email} onChange={set("email")} autoComplete="email" /></Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone" hint="Optional."><input type="tel" className={inputCls()} value={d.phone} onChange={set("phone")} autoComplete="tel" /></Field>
        <Field label="Subject" error={errors.subject}><input className={inputCls(!!errors.subject)} value={d.subject} onChange={set("subject")} placeholder="e.g. Admission question" /></Field>
      </div>
      <Field label="Message" error={errors.message}>
        <textarea rows={5} className={`${inputCls(!!errors.message)} h-auto py-3`} value={d.message} onChange={set("message")} />
      </Field>
      <Button onClick={submit} loading={state === "sending"} size="lg">
        {state === "sending" ? "Sending…" : "Send Message"}
      </Button>
    </div>
  );
}
