"use client";
import { useState } from "react";
import { Plus, CalendarRange, List } from "lucide-react";
import { PageHeader, Card, Status, Loading, ErrorNotice, NoResults } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import RowActions from "@/components/admin/RowActions";
import EntryForm from "@/components/admin/EntryForm";
import { eventFields, eventToForm, newEventForm } from "@/components/admin/eventFields";
import { useCollection } from "@/components/admin/useCollection";
import SchoolCalendar from "@/components/site/SchoolCalendar";
import { formatDate, todayIso } from "@/lib/format";
import { isPublicEntry } from "@/lib/visibility";
import type { CalEvent, EventItem } from "@/lib/types";

export default function AdminCalendar() {
  const { items, loading, error, saving, create, update, remove, reload } = useCollection<EventItem>("events");
  const [view, setView] = useState<"month" | "agenda">("month");
  const [editing, setEditing] = useState<EventItem | "new" | null>(null);

  const rows = (items ?? []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const today = todayIso();

  // The month view mirrors exactly what families see on the public calendar.
  const published: CalEvent[] = rows
    .filter((e) => isPublicEntry(e, today) && !!e.date)
    .map(({ id, date, title, category, time, location }) => ({
      id, date, title, category, time: time || undefined, location: location || undefined,
    }));
  const openingMonth = (published.find((e) => e.date >= today) ?? published[0])?.date.slice(0, 7);

  const submit = async (values: Record<string, string>) => {
    const ok = editing === "new" ? await create(values) : await update((editing as EventItem).id, values);
    if (ok) setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Calendar"
        lead="Every date families see on the public School Calendar. Draft dates stay hidden until they are published."
        action={
          <div className="flex gap-2">
            <div className="flex rounded-full border border-mist bg-white p-1" role="tablist" aria-label="Calendar view">
              {(["month", "agenda"] as const).map((v) => (
                <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium capitalize ${view === v ? "bg-ink text-white" : "text-charcoal"}`}>
                  {v === "month" ? <CalendarRange className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />} {v}
                </button>
              ))}
            </div>
            <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Add Date</Button>
          </div>
        }
      />
      {error && <ErrorNotice message={error} onRetry={reload} />}

      {loading ? (
        <Card><Loading label="Loading calendar…" /></Card>
      ) : view === "month" ? (
        <SchoolCalendar events={published} initialMonth={openingMonth} />
      ) : (
        <Card>
          {rows.length === 0 ? (
            <NoResults title="No dates yet" hint="Add a date to put it on the public calendar." />
          ) : (
            <ul className="divide-y divide-mist">
              {rows.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div>
                    <p className="font-medium text-ink">{e.title}</p>
                    <p className="text-sm text-slate2">
                      {formatDate(e.date)}{e.time ? ` · ${e.time}` : ""}{e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-ivory px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate2">{e.category}</span>
                    <Status value={e.status} />
                    <RowActions
                      label={e.title}
                      previewHref={e.status === "Published" ? "/calendar" : undefined}
                      onEdit={() => setEditing(e)}
                      onDelete={() => remove(e.id)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {editing && (
        <EntryForm
          title={editing === "new" ? "Add date" : "Edit date"}
          fields={eventFields}
          initial={editing === "new" ? newEventForm : eventToForm(editing)}
          saving={saving}
          error={error}
          onClose={() => setEditing(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
