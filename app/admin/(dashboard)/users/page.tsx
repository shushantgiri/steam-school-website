"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, ShieldCheck, X } from "lucide-react";
import { PageHeader, Card, DataTable, Loading, ErrorNotice, NoResults } from "@/components/admin/ui";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client-api";
import { askConfirm, toast } from "@/components/admin/Feedback";
import { formatDate } from "@/lib/format";
import type { CmsUser } from "@/app/api/users/route";

const ROLES = ["Super Admin", "Content Manager", "Admission Manager", "Editor", "Teacher"] as const;

const ROLE_NOTES: Record<(typeof ROLES)[number], string> = {
  "Super Admin": "Full access, including users and settings.",
  "Content Manager": "News, notices, events, calendar, gallery and media.",
  "Admission Manager": "Applications, admission settings and messages.",
  Editor: "Can draft content; publishing needs a manager.",
  Teacher: "Examination results only: add, upload CSV, publish.",
};

type Draft = { name: string; email: string; password: string; role: (typeof ROLES)[number] };
const emptyDraft: Draft = { name: "", email: "", password: "", role: "Editor" };

export default function AdminUsers() {
  const [users, setUsers] = useState<CmsUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError(null);
    try {
      setUsers(await api.get<CmsUser[]>("/api/users"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load users.");
      setUsers([]);
    }
  };

  useEffect(() => {
    load();
    fetch("/api/auth/session").then((r) => r.json()).then((d) => setMe(d?.email ?? "")).catch(() => {});
  }, []);

  const flash = (msg: string) => toast(msg);

  const create = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/users", draft);
      setCreating(false);
      setDraft(emptyDraft);
      flash(`Account created — ${draft.email} can sign in now.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the account.");
    } finally {
      setSaving(false);
    }
  };

  const [resetFor, setResetFor] = useState<CmsUser | null>(null);
  const [newPass, setNewPass] = useState({ a: "", b: "" });
  const [resetting, setResetting] = useState(false);

  const resetPassword = async () => {
    if (!resetFor) return;
    if (newPass.a.length < 8) return setError("The new password needs at least 8 characters.");
    if (newPass.a !== newPass.b) return setError("The two passwords do not match.");
    setResetting(true);
    setError(null);
    try {
      await api.patch(`/api/users/${resetFor.id}`, { password: newPass.a });
      flash(`Password reset for ${resetFor.email}. Share it with them securely and ask them to change it after signing in.`);
      setResetFor(null);
      setNewPass({ a: "", b: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset the password.");
    } finally {
      setResetting(false);
    }
  };

  const setRole = async (u: CmsUser, role: string) => {
    try {
      await api.patch(`/api/users/${u.id}`, { role });
      flash(`${u.email} is now ${role}.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change the role.");
    }
  };

  const toggleStatus = async (u: CmsUser) => {
    const status = u.status === "Active" ? "Disabled" : "Active";
    if (status === "Disabled") {
      const ok = await askConfirm({
        title: `Disable ${u.email}?`,
        body: "They won't be able to sign in until re-activated.",
        confirmLabel: "Disable", danger: true,
      });
      if (!ok) return;
    }
    try {
      await api.patch(`/api/users/${u.id}`, { status });
      flash(`${u.email} ${status === "Disabled" ? "disabled" : "re-activated"}.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the account.");
    }
  };

  const remove = async (u: CmsUser) => {
    const ok = await askConfirm({
      title: `Delete ${u.email}?`,
      body: "Their account is removed permanently. This cannot be undone.",
      confirmLabel: "Delete", danger: true,
    });
    if (!ok) return;
    try {
      await api.del(`/api/users/${u.id}`);
      flash(`${u.email} deleted.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the account.");
    }
  };

  const rows = users ?? [];

  return (
    <div>
      <PageHeader
        title="Admin Users"
        lead="Who can sign in to the CMS. Only a Super Admin can manage this page."
        action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add User</Button>}
      />
      {error && <ErrorNotice message={error} onRetry={load} />}

      <Card>
        {users === null ? (
          <Loading label="Loading users…" />
        ) : rows.length === 0 ? (
          <NoResults title="No accounts found" hint="Use Add User to create the first staff account." />
        ) : (
          <DataTable
            columns={["Name", "Email", "Role", "Status", "Created", "Last active"]}
            rows={rows.map((u) => [
              <span key="n" className="font-medium text-ink">
                {u.name || "—"}{" "}
                {u.email.toLowerCase() === me.toLowerCase() && <Badge tone="teal">You</Badge>}
              </span>,
              u.email,
              <select
                key="r"
                value={u.role ?? ""}
                onChange={(e) => setRole(u, e.target.value)}
                className="h-9 rounded-lg border border-mist bg-white px-2 text-sm"
              >
                {u.role === null && <option value="">No role</option>}
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>,
              <Badge key="s" tone={u.status === "Active" ? "teal" : "gray"}>{u.status}</Badge>,
              u.created_at ? formatDate(u.created_at.slice(0, 10)) : "—",
              u.last_sign_in_at ? formatDate(u.last_sign_in_at.slice(0, 10)) : "Never",
            ])}
            renderActions={(i) => {
              const u = rows[i];
              const self = u.email.toLowerCase() === me.toLowerCase();
              return (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setNewPass({ a: "", b: "" }); setResetFor(u); }}>
                    Reset password
                  </Button>
                  <Button variant="outline" size="sm" disabled={self} onClick={() => toggleStatus(u)}>
                    {u.status === "Active" ? "Disable" : "Activate"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={self}
                    className="!text-red-600 hover:!bg-red-50"
                    onClick={() => remove(u)}
                    aria-label={`Delete ${u.email}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            }}
          />
        )}
      </Card>

      <div className="mt-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate2">Roles</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {ROLES.map((r) => (
            <Card key={r} className="!p-5">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-teal-700" /> {r}
              </p>
              <p className="mt-1.5 text-sm text-slate2">{ROLE_NOTES[r]}</p>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate2">
          Today, roles are recorded and user management is locked to Super Admins. Per-role limits on
          content areas (e.g. Editors needing approval to publish) are the next step.
        </p>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Add user">
          <button aria-label="Close" onClick={() => setCreating(false)} className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-md rounded-xl2 border border-mist bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-mist pb-4">
              <h2 className="text-lg font-semibold text-ink">Add User</h2>
              <button onClick={() => setCreating(false)} aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-lg border border-mist text-slate2 hover:border-ink/40 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <label className="block text-sm">
                <span className="font-medium text-ink">Full name</span>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 focus:border-teal-600" />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">Email</span>
                <input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 focus:border-teal-600" />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">Password</span>
                <input type="text" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                  placeholder="At least 8 characters" className="mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 focus:border-teal-600" />
                <span className="mt-1 block text-xs text-slate2">Share it with the person privately; they can change it later.</span>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">Role</span>
                <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Draft["role"] })}
                  className="mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3">
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button loading={saving} onClick={create}>Create Account</Button>
            </div>
          </div>
        </div>
      )}

      {resetFor && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Reset password">
          <button aria-label="Close" onClick={() => setResetFor(null)} className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-md rounded-xl2 border border-mist bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Reset password</h2>
            <p className="mt-1 text-sm text-slate2">Set a new password for <span className="font-medium text-ink">{resetFor.email}</span>. Their current password stops working immediately.</p>
            <div className="mt-4 space-y-3 text-sm">
              <label className="block"><span className="font-medium text-ink">New password</span>
                <input type="password" autoComplete="new-password" value={newPass.a} onChange={(e) => setNewPass((p) => ({ ...p, a: e.target.value }))}
                  className="mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 focus:border-teal-600" /></label>
              <label className="block"><span className="font-medium text-ink">Confirm new password</span>
                <input type="password" autoComplete="new-password" value={newPass.b} onChange={(e) => setNewPass((p) => ({ ...p, b: e.target.value }))}
                  className="mt-1 h-11 w-full rounded-lg border border-mist bg-white px-3 focus:border-teal-600" /></label>
              <p className="text-xs text-slate2">At least 8 characters. Only a Super Admin can do this, and it is recorded in the activity log.</p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResetFor(null)}>Cancel</Button>
              <Button loading={resetting} onClick={resetPassword}>Reset Password</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}