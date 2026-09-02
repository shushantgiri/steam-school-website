"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader, Card, DataTable, Status, Loading, ErrorNotice, NoResults } from "@/components/admin/ui";
import Toolbar from "@/components/admin/Toolbar";
import RowActions from "@/components/admin/RowActions";
import EntryForm, { type FieldDef } from "@/components/admin/EntryForm";
import { useCollection } from "@/components/admin/useCollection";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { STATUSES, type NewsItem } from "@/lib/types";

const filters = ["All", "Published", "Draft", "Archived"];

const fields: FieldDef[] = [
  { name: "title", label: "Title", full: true },
  { name: "category", label: "Category", placeholder: "Achievements, Campus, People…" },
  { name: "author", label: "Author" },
  { name: "date", label: "Date", type: "date", help: "Required to publish or schedule." },
  { name: "status", label: "Status", type: "select", options: STATUSES },
  { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2, full: true, help: "Shown in the news list. Taken from the first paragraph if left blank." },
  { name: "body", label: "Story", type: "textarea", rows: 7, full: true, help: "Leave a blank line between paragraphs." },
  {
    name: "image", label: "Story image", type: "image", full: true,
    folder: "news", location: "News → Story cover image", recommended: "1600 × 900 px",
    help: "Shown at the top of the story and in the news list.",
  },
  { name: "attachment", label: "Attachment", placeholder: "notice.pdf" },
  { name: "popup", label: "Show as popup on the website", type: "select", options: ["No", "Yes"], help: "When Yes, visitors see this as a popup announcement when they open the website. The newest flagged item is shown." },
];

const toForm = (r: NewsItem): Record<string, string> => ({
  popup: r.popup ? "Yes" : "No",
  title: r.title, category: r.category, author: r.author, date: r.date,
  status: r.status, excerpt: r.excerpt, body: r.body.join("\n\n"),
  image: r.image ?? "", attachment: r.attachment ?? "",
});

export default function AdminNews() {
  const { items, loading, error, saving, create, update, remove, reload } = useCollection<NewsItem>("news");
  const [editing, setEditing] = useState<NewsItem | "new" | null>(null);
  const [q, setQ] = useState("");
  const [f, setF] = useState("All");

  const rows = items ?? [];
  const shown = rows.filter(
    (r) => (f === "All" || r.status === f) && r.title.toLowerCase().includes(q.toLowerCase())
  );

  const submit = async (values: Record<string, string>) => {
    const ok = editing === "new" ? await create(values) : await update((editing as NewsItem).id, values);
    if (ok) setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="News"
        lead="Write and publish stories from around the school. Published stories appear on the website immediately."
        action={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Create News</Button>}
      />
      {error && <ErrorNotice message={error} onRetry={reload} />}
      <Card>
        <Toolbar placeholder="Search news…" filters={filters} active={f} onFilter={setF} onSearch={setQ} />
        {loading ? (
          <Loading label="Loading news…" />
        ) : shown.length === 0 ? (
          <NoResults
            title={rows.length === 0 ? "No news yet" : "No news matches that search"}
            hint={rows.length === 0 ? "Create your first story to see it on the website." : "Try a different word, or clear the filter."}
          />
        ) : (
          <DataTable
            columns={["Title", "Category", "Author", "Date", "Status"]}
            rows={shown.map((r) => [
              r.title, r.category, r.author, formatDate(r.date), <Status key="s" value={r.status} />,
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
          title={editing === "new" ? "Create news" : "Edit news"}
          fields={fields}
          initial={editing === "new" ? { status: "Draft" } : toForm(editing)}
          saving={saving}
          error={error}
          onClose={() => setEditing(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
