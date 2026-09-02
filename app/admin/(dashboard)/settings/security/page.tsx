"use client";
import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import SettingsShell from "@/components/admin/SettingsShell";
import { Card } from "@/components/admin/ui";
import ChangePassword from "@/components/admin/ChangePassword";

/** Settings → Security: passwords and who can sign in. */
export default function SecuritySettings() {
  return (
    <SettingsShell title="Security" lead="Your password and the people who can sign in to this admin." saveLabel="Save">
      {() => (
        <>
          <Card title="Your password">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="flex items-start gap-3 text-sm text-charcoal"><KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" /> Change your own password. You'll need your current password.</p>
              <ChangePassword />
            </div>
          </Card>
          <Card title="Admin users">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="flex items-start gap-3 text-sm text-charcoal"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" /> Add or remove staff accounts, change roles, and reset a user's password if they forget it (Super Admin only).</p>
              <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline">Manage users <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </Card>
        </>
      )}
    </SettingsShell>
  );
}
