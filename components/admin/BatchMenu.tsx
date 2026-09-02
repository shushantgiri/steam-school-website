"use client";

/**
 * BatchMenu — the ⋮ actions menu on each result-batch row.
 *
 * The dropdown is rendered with `position: fixed` and coordinates computed
 * from the button, so it floats above everything and can never be clipped by
 * the table's scroll container (which is what hid it before). It flips
 * upward automatically when the row sits near the bottom of the screen, and
 * closes on outside click, Escape, scroll or resize.
 */

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

export type BatchMenuAction =
  | "view" | "edit" | "upload" | "add" | "publish" | "export" | "delete";

const MENU_WIDTH = 176;   // w-44
const MENU_HEIGHT = 268;  // 7 items — used only to decide whether to flip up

export default function BatchMenu({ title, published, onAction }: {
  title: string;
  published: boolean;
  onAction: (action: BatchMenuAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const flipUp = r.bottom + MENU_HEIGHT > window.innerHeight - 8;
    setPos({
      top: flipUp ? Math.max(8, r.top - MENU_HEIGHT) : r.bottom + 4,
      left: Math.max(8, Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
    });
  };

  const toggle = () => {
    if (open) { setOpen(false); return; }
    place();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onMove = () => setOpen(false); // any scroll/resize: close rather than drift
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  const item = (label: string, action: BatchMenuAction, danger = false) => (
    <button
      role="menuitem"
      onClick={() => { setOpen(false); onAction(action); }}
      className={`block w-full px-4 py-2 text-left text-sm ${danger ? "text-red-600 hover:bg-red-50" : "text-ink hover:bg-ivory"}`}
    >
      {label}
    </button>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-label={`Actions for ${title}`} aria-expanded={open} aria-haspopup="menu"
        className="grid h-8 w-8 place-items-center rounded-lg text-slate2 hover:bg-ivory hover:text-ink"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: pos.top, left: pos.left, width: MENU_WIDTH }}
          className="z-50 overflow-hidden rounded-xl border border-mist bg-white py-1 shadow-lift"
        >
          {item("View Results", "view")}
          {item("Edit Batch", "edit")}
          {item("Add Result", "add")}
          {item("Upload CSV", "upload")}
          {item(published ? "Unpublish" : "Publish", "publish")}
          {item("Export CSV", "export")}
          {item("Delete", "delete", true)}
        </div>
      )}
    </>
  );
}
