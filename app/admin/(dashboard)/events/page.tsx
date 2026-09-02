"use client";
import { useState } from "react";
import { Plus, CalendarCheck2 } from "lucide-react";
import { PageHeader, Card, DataTable, Status, Loading, ErrorNotice, NoResults } from "@/components/admin/ui";
import Toolbar from "@/components/admin/Toolbar";
import RowActions from "@/components/admin/RowActions";
import EntryForm from "@/components/admin/EntryForm";
import { eventFields, eventToForm, newEventForm } from "@/components/admin/eventFields";
import { useCollection } from "@/components/admin/useCollection";
import { Button } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import { type EventItem } from "@/lib/types";

const filters = ["All", "Published", "Draft", "Archived"];

export default function AdminEvents() {
  const { items, loading, error, saving, create, update, remove, reload } = useCollection<EventItem>("events");
  const [editing, setEditing] = useState<EventItem | "new" | null>(null);
  const [q, setQ] = useState("");
  const [f, setF] = useState("All");

  const rows = items ?? [];
  const shown = rows
    .filter((r) => (f === "All" || r.status === f) && r.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  const submit = async (values: Record<string, string>) => {
    const ok = editing === "new" ? await create(values) : await update((editing as EventItem).id, values);
    if (ok) setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Events"
        lead="Published events appear on the Events page and are added to the school calendar automatically."
        action={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Add Event</Button>}
      />
      {error && <ErrorNotice message={error} onRetry={reload} />}
      <Card>
        <Toolbar placeholder="Search events…" filters={filters} active={f} onFilter={setF} onSearch={setQ} />
        {loading ? (
          <Loading label="Loading events…" />
        ) : shown.length === 0 ? (
          <NoResults
            title={rows.length === 0 ? "No events yet" : "No events match"}
            hint={rows.length === 0 ? "Add an event to put it on the website and the calendar." : "Try a different word, or clear the filter."}
          />
        ) : (
          <DataTable
            columns={["Event", "Date", "Time", "Location", "Category", "Status"]}
            rows={shown.map((r) => [
              <span key="t" className="inline-flex items-center gap-2">
                {r.title}
                {r.featured && <Badge tone="sun">Featured</Badge>}
              </span>,
              formatDate(r.date), r.time || "—", r.location || "—", r.category,
              <Status key="s" value={r.status} />,
            ])}
            renderActions={(i) => (
              <RowActions
                label={shown[i].title}
                previewHref={shown[i].status === "Published" ? "/events" : undefined}
                onEdit={() => setEditing(shown[i])}
                onDelete={() => remove(shown[i].id)}
              />
            )}
          />
        )}
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-teal-50 px-4 py-3 text-xs text-teal-900">
          <CalendarCheck2 className="h-4 w-4 shrink-0" /> Events are synced to the public School Calendar the moment they are published.
        </p>
      </Card>

      {editing && (
        <EntryForm
          title={editing === "new" ? "Add event" : "Edit event"}
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
