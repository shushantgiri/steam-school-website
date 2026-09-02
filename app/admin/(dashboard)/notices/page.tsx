"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader, Card, DataTable, Status, Loading, ErrorNotice, NoResults } from "@/components/admin/ui";
import Toolbar from "@/components/admin/Toolbar";
import RowActions from "@/components/admin/RowActions";
import EntryForm, { type FieldDef } from "@/components/admin/EntryForm";
import { useCollection } from "@/components/admin/useCollection";
import { Button } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import { PRIORITIES, STATUSES, type NoticeItem } from "@/lib/types";

const filters = ["All", "Published", "Scheduled", "Draft", "Expired"];

const fields: FieldDef[] = [
  { name: "title", label: "Title", full: true },
  { name: "category", label: "Category", placeholder: "Admission, Exam, Holiday, Transport…", help: "Exam and Holiday notices keep their own badge on the website." },
  { name: "priority", label: "Priority", type: "select", options: PRIORITIES },
  { name: "date", label: "Date", type: "date", help: "A scheduled notice appears on this date." },
  { name: "expires", label: "Expiry date", type: "date", help: "Optional. The notice leaves the website after this date automatically." },
  { name: "status", label: "Status", type: "select", options: STATUSES },
  { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2, full: true, help: "Shown in the notice list. Taken from the first paragraph if left blank." },
  { name: "body", label: "Notice", type: "textarea", rows: 7, full: true, help: "Leave a blank line between paragraphs." },
  { name: "attachment", label: "Attachment", placeholder: "routine.pdf" },
  { name: "popup", label: "Show as popup on the website", type: "select", options: ["No", "Yes"], help: "When Yes, visitors see this as a popup announcement when they open the website. The newest flagged item is shown." },
];

const toForm = (r: NoticeItem): Record<string, string> => ({
  popup: r.popup ? "Yes" : "No",
  title: r.title, category: r.category, priority: r.priority, date: r.date, expires: r.expires ?? "",
  status: r.status, excerpt: r.excerpt, body: r.body.join("\n\n"),
  attachment: r.attachment ?? "",
});

export default function AdminNotices() {
  const { items, loading, error, saving, create, update, remove, reload } = useCollection<NoticeItem>("notices");
  const [editing, setEditing] = useState<NoticeItem | "new" | null>(null);
  const [q, setQ] = useState("");
  const [f, setF] = useState("All");

  const rows = items ?? [];
  const shown = rows.filter(
    (r) => (f === "All" || r.status === f) && r.title.toLowerCase().includes(q.toLowerCase())
  );

  const submit = async (values: Record<string, string>) => {
    const ok = editing === "new" ? await create(values) : await update((editing as NoticeItem).id, values);
    if (ok) setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Notices"
        lead="Official announcements shown on the website, with optional PDF attachments. Scheduled notices publish themselves on their date."
        action={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Create Notice</Button>}
      />
      {error && <ErrorNotice message={error} onRetry={reload} />}
      <Card>
        <Toolbar placeholder="Search notices…" filters={filters} active={f} onFilter={setF} onSearch={setQ} />
        {loading ? (
          <Loading label="Loading notices…" />
        ) : shown.length === 0 ? (
          <NoResults
            title={rows.length === 0 ? "No notices yet" : "No notices match"}
            hint={rows.length === 0 ? "Publish your first notice to see it on the website." : "Try a different word, or clear the filter."}
          />
        ) : (
          <DataTable
            columns={["Title", "Category", "Date", "Priority", "Status"]}
            rows={shown.map((r) => [
              r.title, r.category, formatDate(r.date),
              <Badge key="p" tone={r.priority === "High" ? "sun" : "gray"}>{r.priority}</Badge>,
              <Status key="s" value={r.status} />,
            ])}
            renderActions={(i) => (
              <RowActions
                label={shown[i].title}
                previewHref={shown[i].status === "Published" ? `/news/${shown[i].slug}` : undefined}
                onEdit={() => setEditing(shown[i])}
                onDelete={() => remove(shown[i].id)}
              />
            )}
          />
        )}
      </Card>

      {editing && (
        <EntryForm
          title={editing === "new" ? "Create notice" : "Edit notice"}
          fields={fields}
          initial={editing === "new" ? { status: "Draft", priority: "Normal" } : toForm(editing)}
          saving={saving}
          error={error}
          onClose={() => setEditing(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
