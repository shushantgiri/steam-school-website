import Link from "next/link";
import { Megaphone, CalendarPlus, ImagePlus, Newspaper, ClipboardList, ArrowUpRight, GraduationCap, UploadCloud } from "lucide-react";
import { Card, QuickAction } from "@/components/admin/ui";
import { getCalendarEvents, getEvents, getNews, getNotices } from "@/lib/data";
import { getAlbums } from "@/lib/gallery";
import { countResults } from "@/lib/results";
import { activity as activityStore, applications as appStore, messages as msgStore } from "@/lib/records";
import { formatDate, todayIso } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [news, notices, events, calendar, albums, apps, msgs, activity, resultStats] = await Promise.all([
    getNews(), getNotices(), getEvents(), getCalendarEvents(),
    getAlbums(), appStore.list(), msgStore.list(), activityStore.list(), countResults()]);
  const today = todayIso();
  const photoCount = albums.reduce((n, a) => n + a.photos.length, 0);
  const unread = msgs.filter((m) => m.status === "Unread").length;

  const published = (rows: { status: string }[]) => rows.filter((r) => r.status === "Published").length;
  const summary = [
    { label: "Notices", value: notices.length, delta: `${published(notices)} published`, href: "/admin/notices" },
    { label: "Events", value: events.length, delta: `${calendar.filter((e) => e.date >= today).length} upcoming`, href: "/admin/events" },
    { label: "Admissions", value: apps.length, delta: `${apps.filter((a) => a.status === "New").length} new`, href: "/admin/admissions" },
    { label: "Result Batches", value: resultStats.batches, delta: `${resultStats.published} published · ${resultStats.students} student results`, href: "/admin/results" },
    { label: "News", value: news.length, delta: `${published(news)} published`, href: "/admin/news" },
    { label: "Gallery", value: photoCount, delta: `${albums.filter((a) => a.status === "Published").length} album(s) live`, href: "/admin/gallery" },
    { label: "Messages", value: msgs.length, delta: `${unread} unread`, href: "/admin/messages" },
  ];

  const upcoming = calendar.filter((e) => e.date >= today).slice(0, 4);
  const admissionOverview = ([
    ["New", "teal"], ["Reviewing", "sun"], ["Accepted", "ink"], ["Rejected", "gray"],
  ] as const).map(([label, tone]) => ({ label, tone, value: apps.filter((a) => a.status === label).length }));
  const totalApps = Math.max(1, admissionOverview.reduce((a, b) => a + b.value, 0));
  const barTone: Record<string, string> = { teal: "bg-teal-600", sun: "bg-sun-400", ink: "bg-ink", gray: "bg-mist" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Good Morning, Admin</h1>
        <p className="mt-1 text-sm text-slate2">Here&rsquo;s what&rsquo;s happening with your school website.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {summary.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-xl2 border border-mist bg-white p-4 shadow-soft transition-colors hover:border-teal-600">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate2">{s.label}</p>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate2 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{s.value}</p>
            <p className="mt-1 text-xs text-teal-700">{s.delta}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Website overview" className="xl:col-span-2">
          <p className="text-sm text-slate2">What families can see right now.</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {([
              ["Live notices", notices.filter((n) => n.status === "Published").length],
              ["Live news stories", published(news)],
              ["Upcoming dates", calendar.filter((e) => e.date >= today).length],
              ["Published albums", albums.filter((a) => a.status === "Published").length],
              ["Photos online", albums.filter((a) => a.status === "Published").reduce((n, a) => n + a.photos.length, 0)],
              ["Unread messages", unread],
            ] as const).map(([label, value]) => (
              <div key={label} className="rounded-lg border border-mist bg-ivory/50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate2">{label}</dt>
                <dd className="mt-1 text-2xl font-bold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-slate2">
            Visitor analytics aren&rsquo;t connected — add your analytics provider to show real traffic here.
          </p>
        </Card>

        <Card title="Admission overview">
          <p className="text-sm text-slate2">{apps.length} application{apps.length === 1 ? "" : "s"} received online</p>
          <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full" role="img" aria-label="Admissions by status">
            {admissionOverview.map((a) => (
              <div key={a.label} className={barTone[a.tone]} style={{ width: `${(a.value / totalApps) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-5 space-y-3">
            {admissionOverview.map((a) => (
              <li key={a.label} className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-charcoal">
                  <span className={`h-2.5 w-2.5 rounded-full ${barTone[a.tone]}`} /> {a.label}
                </span>
                <span className="font-semibold text-ink">{a.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Recent activity" className="xl:col-span-1">
          <ul className="space-y-4">
            {activity.length === 0 && (
              <li className="text-sm text-slate2">Nothing yet — publish a notice or upload photos and it shows up here.</li>
            )}
            {activity.slice(0, 6).map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" aria-hidden />
                <div>
                  <p className="text-sm text-ink">{a.action}</p>
                  <p className="mt-0.5 text-xs text-slate2">{a.type} · {formatDate(a.created_at.slice(0, 10))}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Upcoming events">
          {upcoming.length === 0 && (
            <p className="text-sm text-slate2">Nothing scheduled. Add a date from the Events page.</p>
          )}
          <ul className="divide-y divide-mist">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink">{e.title}</p>
                  <p className="text-xs text-slate2">{formatDate(e.date)}{e.time ? ` · ${e.time}` : ""}</p>
                </div>
                <span className="shrink-0 rounded-full bg-ivory px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate2">{e.category}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Quick actions">
          <div className="grid gap-2.5">
            <QuickAction href="/admin/notices"><Megaphone className="h-4 w-4 text-teal-600" /> Create Notice</QuickAction>
            <QuickAction href="/admin/events"><CalendarPlus className="h-4 w-4 text-teal-600" /> Add Event</QuickAction>
            <QuickAction href="/admin/gallery"><ImagePlus className="h-4 w-4 text-teal-600" /> Upload Photos</QuickAction>
            <QuickAction href="/admin/news"><Newspaper className="h-4 w-4 text-teal-600" /> Create News</QuickAction>
            <QuickAction href="/admin/admissions"><ClipboardList className="h-4 w-4 text-teal-600" /> View Applications</QuickAction>
            <QuickAction href="/admin/results"><GraduationCap className="h-4 w-4 text-teal-600" /> Add Result</QuickAction>
            <QuickAction href="/admin/results"><UploadCloud className="h-4 w-4 text-teal-600" /> Upload Results CSV</QuickAction>
          </div>
        </Card>
      </div>
    </div>
  );
}
