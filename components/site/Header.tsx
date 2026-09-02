"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import Logo, { logoLines } from "./Logo";
import { ButtonLink } from "@/components/ui/Button";
import type { SiteSettings } from "@/lib/types";
import type { NavEntry } from "@/lib/navigation";

/**
 * Public navigation. The structure comes from the CMS (Admin → Navigation):
 * plain links plus grouped dropdowns on desktop, and a full-height drawer
 * with nested submenus (drill in, Back to return) on mobile.
 *
 * IMPORTANT: the mobile drawer is rendered through a portal onto <body>.
 * The header bar uses backdrop-blur, and a filtered ancestor becomes the
 * containing block for position:fixed children (Chrome), which would trap
 * the drawer inside the 80px header bar. The portal escapes that entirely.
 */
export default function Header({ settings, nav }: { settings: SiteSettings; nav: NavEntry[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);        // portal target exists only in the browser
  const [open, setOpen] = useState(false);              // mobile drawer
  const [openDrop, setOpenDrop] = useState<string | null>(null); // desktop dropdown id
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set()); // mobile accordion
  const pathname = usePathname();
  const { prefix, name } = logoLines(settings.name, settings.shortName);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); setOpenGroups(new Set()); setOpenDrop(null); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Desktop dropdown: close on outside click or Escape.
  useEffect(() => {
    if (!openDrop) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenDrop(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenDrop(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [openDrop]);

  const isActive = (href: string) => {
    const base = href.split(/[?#]/)[0];
    return base === "/" ? pathname === "/" : pathname.startsWith(base);
  };

  const drawer = (
    <div className={`fixed inset-0 z-[70] lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <div
        className={`fixed inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-paper shadow-lift transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Menu"
      >
        <div className="flex min-h-20 shrink-0 items-center justify-between gap-3 border-b border-mist bg-paper px-5 py-3">
          <Logo prefix={prefix} name={name} src={settings.logoUrl} />
          <button
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-mist bg-white"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Accordion: groups expand in place, no drill-in or Back button. */}
        <nav aria-label="Mobile" className="min-h-0 flex-1 overflow-y-auto bg-paper px-5 py-2">
          {nav.map((item) => {
            const base = (h: string) => h.split(/[?#]/)[0];
            const hasChildren = item.children.length > 0;
            const expanded = openGroups.has(item.id);
            const children = hasChildren && !item.children.some((c) => base(c.href) === base(item.href))
              ? [{ id: `${item.id}-overview`, label: `${item.label} overview`, href: item.href, enabled: true }, ...item.children]
              : item.children;
            const active = isActive(item.href) || item.children.some((c) => isActive(c.href));
            if (!hasChildren) {
              return (
                <Link key={item.id} href={item.href}
                  className={`group flex items-center justify-between border-b border-mist py-4 text-lg font-medium ${active ? "text-teal-700" : "text-ink"}`}>
                  {item.label}
                  <ArrowUpRight className="h-4 w-4 text-slate2" aria-hidden />
                </Link>
              );
            }
            return (
              <div key={item.id} className="border-b border-mist">
                <button
                  onClick={() => setOpenGroups((g) => { const n = new Set(g); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); return n; })}
                  aria-expanded={expanded}
                  className={`flex w-full items-center justify-between py-4 text-lg font-medium ${active ? "text-teal-700" : "text-ink"}`}
                >
                  {item.label}
                  <ChevronDown className={`h-5 w-5 text-slate2 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} aria-hidden />
                </button>
                <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <ul className="overflow-hidden">
                    {children.map((c) => (
                      <li key={c.id}>
                        <Link href={c.href}
                          className={`flex items-center justify-between border-t border-mist/60 py-3 pl-4 pr-1 text-base ${isActive(c.href) ? "font-medium text-teal-700" : "text-charcoal"}`}>
                          {c.label}
                          <ArrowUpRight className="h-3.5 w-3.5 text-slate2" aria-hidden />
                        </Link>
                      </li>
                    ))}
                    <li className="pb-2" />
                  </ul>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-mist bg-paper p-5">
          <ButtonLink href="/admissions/apply" className="w-full">Apply Now</ButtonLink>
        </div>
      </div>
    </div>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-mist bg-paper/95 shadow-soft backdrop-blur" : "border-b border-mist/60 bg-paper/90 backdrop-blur"
      }`}
    >
      <div className={`mx-auto flex max-w-shell items-center justify-between gap-3 px-5 transition-all duration-300 sm:px-8 ${scrolled ? "h-16" : "h-20"}`}>
        <Logo prefix={prefix} name={name} src={settings.logoUrl} />

        {/* Desktop */}
        <nav ref={navRef} aria-label="Main" className="hidden min-w-0 items-center gap-0.5 lg:flex">
          {nav.map((item) => {
            const active = isActive(item.href) || item.children.some((c) => isActive(c.href));
            const hasChildren = item.children.length > 0;
            const label = item.short ? (
              <>
                <span className="xl:hidden">{item.short}</span>
                <span className="hidden xl:inline">{item.label}</span>
              </>
            ) : item.label;
            const linkCls = `whitespace-nowrap rounded-full px-2 py-2 text-[12px] font-medium transition-colors xl:px-3 xl:text-[13px] ${
              active ? "text-teal-700" : "text-charcoal hover:text-ink"
            }`;
            if (!hasChildren) {
              return (
                <Link key={item.id} href={item.href} className={linkCls} aria-current={active ? "page" : undefined}>
                  {label}
                </Link>
              );
            }
            const opened = openDrop === item.id;
            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setOpenDrop(item.id)}
                onMouseLeave={() => setOpenDrop((d) => (d === item.id ? null : d))}
              >
                <button
                  className={`${linkCls} inline-flex items-center gap-1`}
                  aria-expanded={opened}
                  aria-haspopup="menu"
                  onClick={() => setOpenDrop(opened ? null : item.id)}
                >
                  {label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${opened ? "rotate-180" : ""}`} aria-hidden />
                </button>
                <div
                  role="menu"
                  aria-label={item.label}
                  className={`absolute left-0 top-full w-52 pt-2 transition-all duration-150 ${
                    opened ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                  }`}
                >
                  <div className="overflow-hidden rounded-xl border border-mist bg-white py-1.5 shadow-lift">
                    {item.children.map((c) => (
                      <Link
                        key={c.id}
                        href={c.href}
                        role="menuitem"
                        className={`block px-4 py-2 text-[13px] transition-colors ${
                          isActive(c.href) ? "font-medium text-teal-700" : "text-charcoal hover:bg-ivory hover:text-ink"
                        }`}
                        onClick={() => setOpenDrop(null)}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <ButtonLink href="/admissions/apply" size="sm" className="hidden whitespace-nowrap sm:inline-flex">
            Apply<span className="lg:hidden xl:inline">&nbsp;Now</span>
          </ButtonLink>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-mist bg-white text-ink lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer — portaled onto <body>; see the note at the top. */}
      {mounted && createPortal(drawer, document.body)}
    </header>
  );
}
