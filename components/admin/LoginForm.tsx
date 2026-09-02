"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, inputCls } from "@/components/ui/Field";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const forgot = async (e: React.MouseEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!email) { setNotice("Type your email above first, then tap Forgot password."); return; }
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      setNotice(data?.message || data?.error || "Could not start a reset — try again.");
    } catch {
      setNotice("Could not start a reset — check your connection.");
    }
  };

  const fail = (text: string) => { setMessage(text); setState("error"); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { fail("Enter both your email and password."); return; }
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { fail(data?.error ?? "Sign-in failed. Please try again."); return; }

      // The session cookie is set; re-render the server components behind it.
      const next = params.get("next");
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      fail("Sign-in failed. Check your connection and try again.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {state === "error" && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {message}
        </p>
      )}
      <Field label="Email">
        <input type="email" className={inputCls(state === "error" && !email)} value={email}
          onChange={(e) => { setEmail(e.target.value); setState("idle"); }} placeholder="you@steamschool.edu.np" autoComplete="email" />
      </Field>
      <Field label="Password">
        <div className="relative">
          <input type={show ? "text" : "password"} className={`${inputCls(state === "error" && !password)} pr-11`} value={password}
            onChange={(e) => { setPassword(e.target.value); setState("idle"); }} autoComplete="current-password" />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate2 hover:text-ink">
            {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </Field>
      <div className="flex items-center justify-between text-sm">
        <label className="inline-flex cursor-pointer items-center gap-2 text-charcoal">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-mist text-teal-600 accent-teal-600" />
          Stay signed in
        </label>
        <a href="#" onClick={forgot} className="font-medium text-teal-700 hover:text-teal-900">Forgot password?</a>
      </div>
      {notice && <p role="status" className="rounded-lg border border-mist bg-ivory px-4 py-3 text-sm text-charcoal">{notice}</p>}
      <Button type="submit" className="w-full" size="lg" loading={state === "loading"} disabled={state === "loading"}>
        {state === "loading" ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
