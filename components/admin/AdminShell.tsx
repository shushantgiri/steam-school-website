"use client";
import type { LucideIcon } from "lucide-react";
import ChangePassword from "@/components/admin/ChangePassword";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Quote, ListTree, BookOpen,
  LayoutDashboard, Home, Info, GraduationCap, Building2, Users2, PhoneCall,
  Newspaper, Megaphone, CalendarDays, CalendarRange, Images, FolderOpen,
  ClipboardList, SlidersHorizontal, MessageSquare, Settings, ShieldCheck, Globe, Share2, FileBadge, AlertTriangle, Wrench, KeyRound,
  Menu, X, LogOut, PanelLeftClose, PanelLeft, ExternalLink,
} from "lucide-react";
import Logo from "@/components/site/Logo";
import Notifications from "@/components/admin/Notifications";
import FeedbackHost from "@/components/admin/Feedback";

type NavItem = { label: string; href: string; icon: LucideIcon; area?: string };
type NavGroup = { title: string; items: NavItem[] };

const groups: NavGroup[] = [
  { title: "Main", items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
  {
    title: "Website",
    items: [
      { label: "Homepage", href: "/admin/homepage", icon: Home, area: "homepage" },
      { label: "Navigation", href: "/admin/navigation", icon: ListTree, area: "navigation" },
      { label: "About Page", href: "/admin/about", icon: Info, area: "homepage" },
      { label: "Academics", href: "/admin/homepage#academics", icon: GraduationCap, area: "homepage" },
      { label: "Facilities", href: "/admin/homepage#facilities", icon: Building2, area: "homepage" },
      { label: "Student Life", href: "/admin/homepage#student-life", icon: Users2, area: "homepage" },
      { label: "Contact", href: "/admin/settings#contact", icon: PhoneCall, area: "settings" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "News", href: "/admin/news", icon: Newspaper, area: "content" },
      { label: "Notices", href: "/admin/notices", icon: Megaphone, area: "content" },
      { label: "Events", href: "/admin/events", icon: CalendarDays, area: "content" },
      { label: "Calendar", href: "/admin/calendar", icon: CalendarRange, area: "content" },
      { label: "Gallery", href: "/admin/gallery", icon: Images, area: "gallery" },
      { label: "Testimonials", href: "/admin/testimonials", icon: Quote, area: "content" },
      { label: "Teachers & Staff", href: "/admin/staff", icon: Users2, area: "content" },
    ],
  },
  {
    title: "Academics",
    items: [
      { label: "Examination Results", href: "/admin/results", icon: GraduationCap, area: "results" },
      { label: "Academic Setup", href: "/admin/academics", icon: BookOpen, area: "academics" },
    ],
  },
  {
    title: "Admissions",
    items: [
      { label: "Applications", href: "/admin/admissions", icon: ClipboardList, area: "admissions" },
      { label: "Admission Settings", href: "/admin/admissions#settings", icon: SlidersHorizontal, area: "admissions" },
    ],
  },
  { title: "Communication", items: [{ label: "Messages", href: "/admin/messages", icon: MessageSquare, area: "messages" }] },
  { title: "Media", items: [{ label: "Media Library", href: "/admin/media", icon: FolderOpen, area: "media" }] },
  {
    title: "Settings",
    items: [
      { label: "General", href: "/admin/settings", icon: Settings, area: "settings" },
      { label: "SEO & Sharing", href: "/admin/settings/seo", icon: Globe, area: "settings" },
      { label: "Social Media", href: "/admin/settings/social", icon: Share2, area: "settings" },
      { label: "Marksheets", href: "/admin/settings/documents", icon: FileBadge, area: "settings" },
      { label: "Error Pages", href: "/admin/settings/error-pages", icon: AlertTriangle, area: "settings" },
      { label: "Maintenance Mode", href: "/admin/settings/maintenance", icon: Wrench, area: "settings" },
      { label: "Security", href: "/admin/settings/security", icon: KeyRound, area: "settings" },
      { label: "Admin Users", href: "/admin/users", icon: ShieldCheck, area: "users" },
    ],
  },
];

function NavLinks({ collapsed, onNavigate, areas }: { collapsed: boolean; onNavigate?: () => void; areas: string[] | null }) {
  const pathname = usePathname();
  // While the role loads, show only Dashboard — never flash sections that may vanish.
  const allowed = (item: { area?: string }) =>
    !item.area || (areas !== null && areas.includes(item.area));
  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter(allowed) }))
    .filter((g) => g.items.length > 0);
  return (
    <nav aria-label="Admin" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {visible.map((g) => (
        <div key={g.title}>
          {!collapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate2">{g.title}</p>
          )}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const base = item.href.split("#")[0];
              const active = base === "/admin" ? pathname === "/admin" : pathname.startsWith(base) && !item.href.includes("#");
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-teal-50 text-teal-700" : "text-charcoal hover:bg-ivory"
                      } ${collapsed ? "justify-center" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                    {!collapsed && item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [areas, setAreas] = useState<string[] | null>(null); // null = still loading
  const [logoUrl, setLogoUrl] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => setDrawer(false), [pathname]);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => setLogoUrl(typeof d?.logoUrl === "string" ? d.logoUrl : ""))
      .catch(() => undefined);
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        setEmail(d?.email ?? null);
        setRole(d?.role ?? null);
        setAreas(Array.isArray(d?.areas) ? d.areas : []);
      })
      .catch(() => setEmail(null));
  }, []);

  /** Clears the session cookie, then leaves the CMS. */
  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-svh bg-ivory/60">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-svh flex-col border-r border-mist bg-paper transition-[width] duration-300 lg:flex ${collapsed ? "w-[76px]" : "w-64"
          }`}
      >
        <div className={`flex h-16 items-center border-b border-mist ${collapsed ? "justify-center" : "justify-between px-4"}`}>
          {!collapsed && <Logo href="/admin" src={logoUrl} />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate2 hover:bg-ivory"
          >
            {collapsed ? <PanelLeft className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          </button>
        </div>
        <NavLinks collapsed={collapsed} areas={areas} />
        <div className="border-t border-mist p-3">
          <div className={`flex items-center gap-3 rounded-lg px-2 py-2 ${collapsed ? "justify-center" : ""}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">A</span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{email ? email.split("@")[0] : "Admin"}</p>
                <p className="truncate text-xs text-slate2" title={email ?? undefined}>{role ? `${role}` : email ?? ""}</p>
              </div>
            )}
            {!collapsed && (
              <div className="flex items-center gap-3">
                <ChangePassword compact />
                <button onClick={signOut} disabled={signingOut} aria-label="Log out" className="text-slate2 hover:text-red-600 disabled:opacity-50"><LogOut className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${drawer ? "" : "pointer-events-none"}`} aria-hidden={!drawer}>
        <div className={`absolute inset-0 bg-ink/40 transition-opacity ${drawer ? "opacity-100" : "opacity-0"}`} onClick={() => setDrawer(false)} />
        <div className={`absolute left-0 top-0 flex h-full w-72 flex-col bg-paper shadow-lift transition-transform duration-300 ${drawer ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-16 items-center justify-between border-b border-mist px-4">
            <Logo href="/admin" src={logoUrl} />
            <button onClick={() => setDrawer(false)} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-ivory"><X className="h-5 w-5" /></button>
          </div>
          <NavLinks collapsed={false} onNavigate={() => setDrawer(false)} areas={areas} />
          <div className="border-t border-mist p-4">
            <ChangePassword />
            <button onClick={signOut} disabled={signingOut} className="flex items-center gap-2 text-sm font-medium text-red-600 disabled:opacity-50"><LogOut className="h-4 w-4" /> {signingOut ? "Signing out…" : "Log out"}</button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-mist bg-paper/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawer(true)} aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-lg border border-mist bg-white lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <p className="hidden text-sm text-slate2 sm:block">The School of STEAM Education · CMS</p>
          </div>
          <div className="flex items-center gap-3">
            <Notifications />
            <Link href="/" target="_blank" className="inline-flex items-center gap-2 rounded-full border border-mist bg-white px-4 py-2 text-sm font-medium text-ink hover:border-ink/40">
              View Website <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <FeedbackHost />
    </div>
  );
}