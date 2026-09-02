"use client";
import { useEffect, useState } from "react";
import { Reply, Archive, Trash2, MailOpen, ChevronLeft, Inbox } from "lucide-react";
import { PageHeader, Card, Loading, ErrorNotice } from "@/components/admin/ui";
import Badge, { statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import type { Message, MsgStatus } from "@/lib/records";

export default function AdminMessages() {
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      setMsgs(await api.get<Message[]>("/api/messages"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load messages.");
    }
  };
  useEffect(() => { load(); }, []);

  // Reload live when the notification bell spots new arrivals.
  useEffect(() => {
    const refresh = () => load();
    window.addEventListener("steam-admin:new-data", refresh);
    return () => window.removeEventListener("steam-admin:new-data", refresh);
  }, []);

  const rows = msgs ?? [];
  const open = rows.find((m) => m.id === openId);

  const setStatus = async (id: string, status: MsgStatus) => {
    try {
      const updated = await api.patch<Message>(`/api/messages/${id}`, { status });
      setMsgs((xs) => (xs ?? []).map((m) => (m.id === id ? updated : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the message.");
    }
  };

  const del = async (id: string) => {
    try {
      await api.del(`/api/messages/${id}`);
      setMsgs((xs) => (xs ?? []).filter((m) => m.id !== id));
      setOpenId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the message.");
    }
  };

  return (
    <div>
      <PageHeader title="Messages" lead="Everything sent through the website's contact form." />
      {error && <ErrorNotice message={error} onRetry={load} />}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <Card className={`${open ? "hidden lg:block" : ""} !p-0`}>
          {msgs === null && !error ? (
            <Loading label="Loading messages…" />
          ) : rows.length === 0 ? (
            <div className="grid place-items-center py-20 text-center">
              <Inbox className="h-8 w-8 text-slate2" />
              <p className="mt-3 font-medium text-ink">Inbox empty</p>
              <p className="mt-1 text-sm text-slate2">New contact-form messages land here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-mist">
              {rows.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => { setOpenId(m.id); if (m.status === "Unread") setStatus(m.id, "Read"); }}
                    className={`w-full px-5 py-4 text-left transition-colors hover:bg-ivory/60 ${openId === m.id ? "bg-teal-50/60" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className={`truncate text-sm ${m.status === "Unread" ? "font-semibold text-ink" : "font-medium text-charcoal"}`}>{m.name}</p>
                      <span className="shrink-0 text-xs text-slate2">{formatDate(m.created_at.slice(0, 10))}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="truncate text-sm text-slate2">{m.subject}</p>
                      <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className={open ? "" : "hidden lg:grid lg:place-items-center"}>
          {open ? (
            <div>
              <button onClick={() => setOpenId(null)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate2 hover:text-ink lg:hidden">
                <ChevronLeft className="h-4 w-4" /> Inbox
              </button>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-mist pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-ink">{open.subject}</h2>
                  <p className="mt-1 text-sm text-slate2">
                    {open.name}{open.email ? ` · ${open.email}` : ""}{open.phone ? ` · ${open.phone}` : ""}
                  </p>
                </div>
                <Badge tone={statusTone(open.status)}>{open.status}</Badge>
              </div>
              <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-charcoal">{open.body}</p>
              <div className="mt-8 flex flex-wrap gap-2 border-t border-mist pt-5">
                <Button size="sm" onClick={() => { setStatus(open.id, "Replied"); if (open.email) window.location.href = `mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject)}`; }}>
                  <Reply className="h-4 w-4" /> Reply
                </Button>
                <Button variant="outline" size="sm" onClick={() => setStatus(open.id, "Read")}><MailOpen className="h-4 w-4" /> Mark Read</Button>
                <Button variant="outline" size="sm" onClick={() => setStatus(open.id, "Archived")}><Archive className="h-4 w-4" /> Archive</Button>
                <Button variant="outline" size="sm" className="!border-red-200 !text-red-600 hover:!bg-red-50" onClick={() => del(open.id)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          ) : (
            <p className="py-24 text-sm text-slate2">Select a message to read it.</p>
          )}
        </Card>
      </div>
    </div>
  );
}