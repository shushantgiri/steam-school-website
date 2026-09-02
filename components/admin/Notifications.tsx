"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, ClipboardList, MessageSquare, Volume2, VolumeX } from "lucide-react";
import type { Application, Message } from "@/lib/records";

/**
 * Live notification bell for the admin topbar.
 *
 * While the CMS is open it checks /api/applications and /api/messages every
 * 30 seconds. When something new arrives it plays a soft two-tone chime,
 * shows a toast, and keeps a badge on the bell until the dropdown is opened.
 *
 * No extra backend needed — it reuses the existing (session-protected) APIs.
 * "Last seen" timestamps live in localStorage, so refreshing the page doesn't
 * replay old alerts. The chime is generated with the Web Audio API — no audio
 * file to ship. Browsers only allow sound after the user has interacted with
 * the page; signing in counts, so in practice it just works. The speaker
 * button lets staff mute it (also remembered in localStorage).
 */

const POLL_MS = 30_000;
const seenKey = "steam-admin-last-seen";
const muteKey = "steam-admin-muted";

type Item = {
    id: string;
    kind: "application" | "message";
    title: string;
    detail: string;
    at: string;
    href: string;
};

function chime(muted: boolean) {
    if (muted || typeof window === "undefined") return;
    try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const note = (freq: number, start: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
            gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.5);
            osc.connect(gain).connect(ctx.destination);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + 0.55);
        };
        note(880, 0);      // A5
        note(1174.66, 0.18); // D6 — a friendly "ding-ding"
        window.setTimeout(() => ctx.close(), 1200);
    } catch {
        /* sound is a nice-to-have; never break the CMS over it */
    }
}

export default function Notifications() {
    const [items, setItems] = useState<Item[]>([]);
    const [unseen, setUnseen] = useState(0);
    const [open, setOpen] = useState(false);
    const [toast, setToast] = useState<Item | null>(null);
    const [muted, setMuted] = useState(false);
    const [mounted, setMounted] = useState(false);
    const lastSeen = useRef<string>("");
    const timerRef = useRef<number | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    // Restore per-browser state once on mount.
    useEffect(() => {
        setMounted(true);
        lastSeen.current = window.localStorage.getItem(seenKey) ?? new Date().toISOString();
        window.localStorage.setItem(seenKey, lastSeen.current);
        setMuted(window.localStorage.getItem(muteKey) === "1");
    }, []);

    const check = useCallback(async () => {
        try {
            const [appsRes, msgsRes] = await Promise.all([
                fetch("/api/applications", { cache: "no-store" }),
                fetch("/api/messages", { cache: "no-store" }),
            ]);
            if (!appsRes.ok || !msgsRes.ok) return; // signed out or offline — stay quiet
            const apps = (await appsRes.json()) as Application[];
            const msgs = (await msgsRes.json()) as Message[];

            const all: Item[] = [
                ...apps.map((a) => ({
                    id: `a-${a.id}`, kind: "application" as const,
                    title: "New admission application",
                    detail: `${a.student} · ${a.grade}`,
                    at: a.created_at, href: "/admin/admissions",
                })),
                ...msgs.map((m) => ({
                    id: `m-${m.id}`, kind: "message" as const,
                    title: "New message",
                    detail: `${m.name} · ${m.subject}`,
                    at: m.created_at, href: "/admin/messages",
                })),
            ].sort((x, y) => y.at.localeCompare(x.at));

            setItems(all.slice(0, 8));

            const fresh = all.filter((i) => i.at > lastSeen.current);
            if (fresh.length > 0) {
                // Tell open admin pages (inbox, admissions) to reload their lists.
                window.dispatchEvent(new CustomEvent("steam-admin:new-data"));
                setUnseen((n) => n + fresh.length);
                setToast(fresh[0]);
                chime(window.localStorage.getItem(muteKey) === "1");
                window.setTimeout(() => setToast(null), 6000);
                lastSeen.current = fresh[0].at;
                window.localStorage.setItem(seenKey, lastSeen.current);
            }
        } catch {
            /* network hiccup — try again next tick */
        }
    }, []);

    // Poll while the tab is open; pause when it's hidden to save battery.
    useEffect(() => {
        const start = () => {
            if (timerRef.current === null) {
                check();
                timerRef.current = window.setInterval(check, POLL_MS);
            }
        };
        const stop = () => {
            if (timerRef.current !== null) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
        const onVisibility = () => (document.hidden ? stop() : start());
        start();
        document.addEventListener("visibilitychange", onVisibility);
        return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
    }, [check]);

    // Close the dropdown on outside click.
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open]);

    const toggleMute = () => {
        setMuted((m) => {
            window.localStorage.setItem(muteKey, m ? "0" : "1");
            return !m;
        });
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                onClick={() => { setOpen((o) => !o); setUnseen(0); }}
                aria-label={unseen > 0 ? `Notifications — ${unseen} new` : "Notifications"}
                className="relative grid h-10 w-10 place-items-center rounded-full border border-mist bg-white text-ink transition-colors hover:border-ink/40"
            >
                <Bell className="h-[18px] w-[18px]" />
                {unseen > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unseen > 9 ? "9+" : unseen}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl2 border border-mist bg-white shadow-soft">
                    <div className="flex items-center justify-between border-b border-mist px-4 py-3">
                        <p className="text-sm font-semibold text-ink">Notifications</p>
                        <button onClick={toggleMute} aria-label={muted ? "Unmute alert sound" : "Mute alert sound"}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate2 hover:bg-ivory hover:text-ink">
                            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                    </div>
                    {items.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-slate2">
                            Nothing yet — new admissions and messages will appear here.
                        </p>
                    ) : (
                        <ul className="max-h-96 divide-y divide-mist overflow-y-auto">
                            {items.map((i) => (
                                <li key={i.id}>
                                    <Link href={i.href} onClick={() => setOpen(false)} className="flex gap-3 px-4 py-3 hover:bg-ivory/60">
                                        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${i.kind === "application" ? "bg-teal-50 text-teal-700" : "bg-sun-100 text-ink"}`}>
                                            {i.kind === "application" ? <ClipboardList className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-sm font-medium text-ink">{i.title}</span>
                                            <span className="block truncate text-xs text-slate2">{i.detail}</span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {mounted && toast && !open &&
                createPortal(
                    <Link
                        href={toast.href}
                        onClick={() => setToast(null)}
                        role="status"
                        aria-live="polite"
                        className="fixed bottom-5 right-5 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm items-start gap-3 rounded-xl2 border border-mist bg-white p-4 shadow-soft"
                    >
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${toast.kind === "application" ? "bg-teal-50 text-teal-700" : "bg-sun-100 text-ink"}`}>
                            {toast.kind === "application" ? <ClipboardList className="h-[18px] w-[18px]" /> : <MessageSquare className="h-[18px] w-[18px]" />}
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold text-ink">{toast.title}</span>
                            <span className="block truncate text-xs text-slate2">{toast.detail}</span>
                            <span className="mt-1 block text-xs font-medium text-teal-700">Open →</span>
                        </span>
                    </Link>,
                    document.body
                )}
        </div>
    );
}