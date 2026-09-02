import type { Metadata } from "next";
import Image from "next/image";
import Logo from "@/components/site/Logo";
import LoginForm from "@/components/admin/LoginForm";
import { img } from "@/lib/images";

export const metadata: Metadata = { title: "Staff Sign In" };

// LoginForm reads the ?next= parameter, so this page renders per request.
export const dynamic = "force-dynamic";

export default function AdminLogin() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <Image src={img.login} alt="" fill sizes="50vw" className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/20" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo dark href="/" />
          <div>
            <p className="eyebrow !text-sun-300">Staff CMS</p>
            <h1 className="display mt-4 max-w-md text-4xl !text-white">
              Manage Your School <span className="mark">Website</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Notices, news, events, admissions and photos — publish updates to families in minutes, no code needed.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-paper px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden"><Logo /></div>
          <h1 className="display mt-10 text-3xl lg:mt-0">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate2">Sign in with your staff account to manage the website.</p>
          <div className="mt-8"><LoginForm /></div>
          <p className="mt-8 text-center text-xs text-slate2">
            Trouble signing in? Contact the Super Admin at the school office.
          </p>
        </div>
      </div>
    </div>
  );
}
