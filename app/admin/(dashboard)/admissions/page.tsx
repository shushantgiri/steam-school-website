"use client";
import { useEffect, useMemo, useState } from "react";
import { Printer, Download, Check, X as XIcon, ChevronLeft, FileText, Trash2, UserCheck } from "lucide-react";
import { PageHeader, Card, DataTable, Loading, ErrorNotice, NoResults } from "@/components/admin/ui";
import Toolbar from "@/components/admin/Toolbar";
import Badge, { statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client-api";
import { askConfirm, toast } from "@/components/admin/Feedback";
import { formatDate } from "@/lib/format";
import type { Application, AppStatus } from "@/lib/records";

const filters = ["All", "New", "Reviewing", "Accepted", "Rejected", "Waitlisted"];

/** "27 Aug 2026 · 2:35 PM" from an ISO timestamp. */
function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatDate(iso.slice(0, 10));
  const time = d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${formatDate(iso.slice(0, 10))} · ${time}`;
}

export default function AdminAdmissions() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [f, setF] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("Everyone");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);

  const load = async () => {
    setError(null);
    try {
      setApps(await api.get<Application[]>("/api/applications"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load applications.");
    }
  };
  useEffect(() => { load(); }, []);

  // Reload live when the notification bell spots new arrivals.
  useEffect(() => {
    const refresh = () => load();
    window.addEventListener("steam-admin:new-data", refresh);
    return () => window.removeEventListener("steam-admin:new-data", refresh);
  }, []);

  const rows = apps ?? [];

  /** Every staff name that has ever been assigned — powers the filter and suggestions. */
  const assignees = useMemo(
    () => Array.from(new Set(rows.map((a) => a.assigned_to).filter(Boolean))).sort(),
    [rows]
  );

  const shown = rows.filter(
    (a) =>
      (f === "All" || a.status === f) &&
      (assigneeFilter === "Everyone" ||
        (assigneeFilter === "Unassigned" ? !a.assigned_to : a.assigned_to === assigneeFilter)) &&
      (a.student + a.parent + a.id + a.assigned_to).toLowerCase().includes(q.toLowerCase())
  );
  const open = rows.find((a) => a.id === openId);

  const patch = async (id: string, body: Partial<Application>) => {
    const updated = await api.patch<Application>(`/api/applications/${id}`, body);
    setApps((xs) => (xs ?? []).map((a) => (a.id === id ? updated : a)));
    return updated;
  };

  const setStatus = (id: string, status: AppStatus) =>
    patch(id, { status }).catch((e) => setError(e instanceof Error ? e.message : "Could not update."));

  const saveNotes = async () => {
    if (!open) return;
    setSavingNote(true);
    try { await patch(open.id, { notes }); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save the note."); }
    finally { setSavingNote(false); }
  };

  const saveAssign = async () => {
    if (!open) return;
    setSavingAssign(true);
    try { await patch(open.id, { assigned_to: assignTo }); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not assign."); }
    finally { setSavingAssign(false); }
  };

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const allShownSelected = shown.length > 0 && shown.every((a) => selected.has(a.id));
  const toggleAllShown = () =>
    setSelected((s) => {
      const next = new Set(s);
      if (allShownSelected) shown.forEach((a) => next.delete(a.id));
      else shown.forEach((a) => next.add(a.id));
      return next;
    });

  const deleteSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const ok = await askConfirm({
      title: `Delete ${ids.length} application(s)?`,
      body: "They are removed permanently, including their document links. This cannot be undone.",
      confirmLabel: "Delete", danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      // Note: today every signed-in admin can delete. Locking this to the
      // Super Admin role is enforced once Supabase user roles are connected.
      await Promise.all(ids.map((id) => api.del(`/api/applications/${id}`)));
      setApps((xs) => (xs ?? []).filter((a) => !selected.has(a.id)));
      setSelected(new Set());
      toast(`${ids.length} application(s) deleted.`, "info");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Some applications could not be deleted.");
      load();
    } finally {
      setDeleting(false);
    }
  };

  if (open) {
    return (
      <div>
        <button onClick={() => setOpenId(null)} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate2 hover:text-ink">
          <ChevronLeft className="h-4 w-4" /> All applications
        </button>
        <PageHeader title={open.student} lead={`${open.id} · Applying for ${open.grade} · Received ${formatDateTime(open.created_at)}`}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="h-4 w-4" /> Download</Button>
              <Button variant="dark" size="sm" onClick={() => setStatus(open.id, "Reviewing")}>Review</Button>
              <Button size="sm" onClick={() => setStatus(open.id, "Accepted")}><Check className="h-4 w-4" /> Accept</Button>
              <Button variant="outline" size="sm" className="!border-red-200 !text-red-600 hover:!bg-red-50" onClick={() => setStatus(open.id, "Rejected")}>
                <XIcon className="h-4 w-4" /> Reject
              </Button>
            </div>
          } />
        {error && <ErrorNotice message={error} />}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="Student information" className="lg:col-span-1">
            <dl className="space-y-3 text-sm">
              {([["Full name", open.student], ["Applying grade", open.grade], ["Date of birth", open.dob || "—"], ["Previous school", open.previous_school || "—"], ["Status", ""]] as const).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wider text-slate2">{k}</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {k === "Status" ? <Badge tone={statusTone(open.status)}>{open.status}</Badge> : v}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="Parent information">
            <dl className="space-y-3 text-sm">
              {([["Parent / guardian", open.parent], ["Phone", open.phone], ["Email", open.email || "—"], ["Address", open.address || "—"]] as const).map(([k, v]) => (
                <div key={k}><dt className="text-xs uppercase tracking-wider text-slate2">{k}</dt><dd className="mt-0.5 font-medium text-ink">{v}</dd></div>
              ))}
            </dl>
          </Card>
          <Card title="Documents">
            {open.documents.length === 0 ? (
              <p className="text-sm text-slate2">No documents were attached.</p>
            ) : (
              <ul className="space-y-2">
                {open.documents.map((d) => (
                  <li key={d} className="flex items-center justify-between gap-3 rounded-lg border border-mist px-3.5 py-2.5 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-ink"><FileText className="h-4 w-4 shrink-0 text-teal-600" /><span className="truncate">{d.split("/").pop()}</span></span>
                    <a href={d} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-medium text-teal-700 hover:underline">View</a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Assignment">
            <p className="text-sm text-slate2">
              {open.assigned_to ? <>Currently handled by <strong className="font-semibold text-ink">{open.assigned_to}</strong>.</> : "Not assigned to anyone yet."}
            </p>
            <div className="mt-3 flex gap-2">
              <input
                list="assignee-names"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                placeholder="Staff member's name…"
                className="h-10 w-full rounded-lg border border-mist bg-white px-3 text-sm placeholder:text-slate2/70 focus:border-teal-600"
              />
              <datalist id="assignee-names">
                {assignees.map((n) => <option key={n} value={n} />)}
              </datalist>
              <Button size="sm" loading={savingAssign} onClick={saveAssign}><UserCheck className="h-4 w-4" /> Assign</Button>
            </div>
            {open.assigned_to && (
              <button onClick={() => { setAssignTo(""); patch(open.id, { assigned_to: "" }); }} className="mt-2 text-xs font-medium text-slate2 hover:text-ink">
                Remove assignment
              </button>
            )}
          </Card>
          <Card title="Application timeline">
            <ol className="space-y-4">
              {([
                ["Application submitted online", formatDateTime(open.created_at)],
                ["Documents received", open.documents.length ? `${open.documents.length} file(s)` : "—"],
                ["Decision", open.status === "New" ? "Pending" : open.status],
              ] as const).map(([t, when], i) => (
                <li key={t} className="flex gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? "bg-teal-600" : "bg-mist"}`} />
                  <div className="flex flex-1 justify-between gap-3 text-sm">
                    <span className="text-ink">{t}</span><span className="text-right text-slate2">{when}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
          <Card title="Internal notes">
            <textarea rows={5} placeholder="Notes are visible to staff only…" value={notes}
              onFocus={() => { if (!notes) setNotes(open.notes); }}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-mist bg-white p-3 text-sm placeholder:text-slate2/70 focus:border-teal-600" />
            <Button size="sm" className="mt-3" loading={savingNote} onClick={saveNotes}>Save Note</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Applications" lead="Applications submitted through the website's admission form." />
      {error && <ErrorNotice message={error} onRetry={load} />}
      <Card>
        <Toolbar placeholder="Search by student, parent, staff or ID…" filters={filters} active={f} onFilter={setF} onSearch={setQ} />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-mist pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-charcoal">
              Assigned:{" "}
              <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}
                className="ml-1 h-9 rounded-lg border border-mist bg-white px-2 text-sm">
                <option>Everyone</option>
                <option>Unassigned</option>
                {assignees.map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            {shown.length > 0 && (
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-charcoal">
                <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown}
                  className="h-4 w-4 rounded border-mist text-teal-600 focus:ring-teal-600" />
                Select all shown
              </label>
            )}
          </div>
          {selected.size > 0 && (
            <Button variant="outline" size="sm" loading={deleting}
              className="!border-red-200 !text-red-600 hover:!bg-red-50" onClick={deleteSelected}>
              <Trash2 className="h-4 w-4" /> Delete selected ({selected.size})
            </Button>
          )}
        </div>

        {apps === null && !error ? (
          <Loading label="Loading applications…" />
        ) : shown.length === 0 ? (
          <NoResults
            title={rows.length === 0 ? "No applications yet" : "No applications match"}
            hint={rows.length === 0 ? "Submissions from the online admission form appear here." : "Try a different name or ID, or clear the filters."}
          />
        ) : (
          <DataTable
            columns={["", "Application ID", "Student", "Grade", "Parent", "Received", "Assigned", "Status"]}
            rows={shown.map((a) => [
              <input key="cb" type="checkbox" aria-label={`Select ${a.id}`} checked={selected.has(a.id)} onChange={() => toggle(a.id)}
                className="h-4 w-4 rounded border-mist text-teal-600 focus:ring-teal-600" />,
              <button key="id" onClick={() => { setOpenId(a.id); setNotes(a.notes); setAssignTo(a.assigned_to); }} className="font-medium text-teal-700 hover:underline">{a.id}</button>,
              a.student, a.grade, a.parent,
              <span key="t" className="whitespace-nowrap text-xs text-charcoal">{formatDateTime(a.created_at)}</span>,
              a.assigned_to || <span key="u" className="text-slate2">—</span>,
              <Badge key="s" tone={statusTone(a.status)}>{a.status}</Badge>,
            ])}
            renderActions={(i) => (
              <Button variant="ghost" size="sm" onClick={() => { setOpenId(shown[i].id); setNotes(shown[i].notes); setAssignTo(shown[i].assigned_to); }}>Open</Button>
            )}
          />
        )}
      </Card>
    </div>
  );
}