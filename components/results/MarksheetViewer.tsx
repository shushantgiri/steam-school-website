"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Printer, ArrowLeft } from "lucide-react";
import MarksheetSheet from "./MarksheetSheet";
import type { MarksheetView } from "@/lib/marksheet";

/**
 * Marksheet viewer used by both the public page (with a family token) and the
 * admin page (with a session). Fetches the view model, renders the A4 sheet,
 * offers Download PDF (server-rendered file) and Print (browser, A4 CSS).
 */
export default function MarksheetViewer({ id, token, backHref, backLabel }: {
  id: string;
  token?: string;
  backHref: string;
  backLabel: string;
}) {
  const [m, setM] = useState<MarksheetView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [sheetH, setSheetH] = useState(1123);
  const frameRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // A4 is 210mm ≈ 794px wide. Scale the sheet down so it always fits the
  // screen (phones included); "Actual size" restores 100% with scrolling.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const A4W = 794;
    const compute = () => {
      setScale(Math.min(1, (el.clientWidth - 16) / A4W));
      if (sheetRef.current) setSheetH(sheetRef.current.offsetHeight);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    if (sheetRef.current) ro.observe(sheetRef.current);
    return () => ro.disconnect();
  }, [m]);
  const q = token ? `?t=${encodeURIComponent(token)}` : "";
  const pdfHref = `/api/marksheet/${id}${q}${q ? "&" : "?"}format=pdf`;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/marksheet/${id}${q}${q ? "&" : "?"}_=${Date.now()}`, { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json().catch(() => null);
        if (!r.ok) throw new Error(body?.error || "Could not load the marksheet.");
        if (!cancelled) setM(body);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load the marksheet."); });
    return () => { cancelled = true; };
  }, [id, q]);

  return (
    <div className="marksheet-page min-h-screen bg-ivory pb-10 pt-4 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: #fff !important; }
          body * { visibility: hidden; }
          .marksheet, .marksheet * { visibility: visible; }
          .marksheet { position: absolute; left: 0; top: 0; margin: 0 !important; box-shadow: none !important; }
          .marksheet-scaler { transform: none !important; height: auto !important; }
        }
      `}</style>

      <div className="mb-6 border-b border-mist bg-paper print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <a href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </a>
          {m && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border border-mist bg-white px-3.5 py-2 text-sm font-medium text-ink hover:bg-ivory"
              >
                <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Print</span>
              </button>
              <a
                href={pdfHref}
                className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
              >
                <Download className="h-4 w-4" /> Download PDF
              </a>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-auto max-w-[210mm] rounded-xl2 border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      )}
      {!error && !m && (
        <div className="mx-auto max-w-[210mm] rounded-xl2 border border-mist bg-white p-8 text-center text-sm text-slate2">Preparing the marksheet…</div>
      )}
      {m && (
        <div ref={frameRef} className="mx-auto max-w-5xl px-2 sm:px-4 print:max-w-none print:overflow-visible print:px-0">
          <div
            className="marksheet-scaler mx-auto"
            style={{ width: 794 * scale, height: sheetH * scale }}
          >
            <div
              ref={sheetRef}
              className="shadow-lift print:shadow-none"
              style={{ width: 794, transform: `scale(${scale})`, transformOrigin: "top left" }}
            >
              <MarksheetSheet m={m} />
            </div>
          </div>
          {scale < 0.98 && (
            <p className="mt-4 pb-6 text-center text-xs text-slate2 print:hidden">Scaled to fit your screen — the PDF and print are full A4 size.</p>
          )}
        </div>
      )}
    </div>
  );
}