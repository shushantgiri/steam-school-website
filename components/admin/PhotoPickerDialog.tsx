"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, ImagePlus, MapPin, Search, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Loading, NoResults } from "@/components/admin/ui";
import type { MediaItem } from "@/app/api/media/route";

/**
 * The one "Change Photo" experience for the whole CMS.
 * Opened from every photo slot, the homepage/about editors, news, events,
 * teacher profiles — one photo system, many easy entry points.
 *
 * Flow:  Where will this photo appear? → Upload new photo OR Select an
 * existing photo → Preview → "Use This Photo" → done.
 *
 * Large uploads are quietly resized before sending (no technical settings
 * shown to the admin) and every problem is explained in plain language.
 */

export const MAX_PHOTO_MB = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIDE = 2000; // px — bigger photos are gently scaled down

/** Shrinks oversized JPG/WebP photos in the browser; anything else passes through. */
async function optimize(file: File): Promise<File> {
  if (!["image/jpeg", "image/webp"].includes(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const largest = Math.max(bitmap.width, bitmap.height);
    if (largest <= MAX_SIDE) return file;
    const scale = MAX_SIDE / largest;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file; // optimization is best-effort — the original still uploads
  }
}

export default function PhotoPickerDialog({
  location,
  folder,
  recommended,
  onClose,
  onSelect,
}: {
  /** Where the photo will appear — always shown first. */
  location: string;
  /** Storage folder for new uploads (homepage, news, staff, …). */
  folder: string;
  recommended?: string;
  onClose: () => void;
  /** Called with the final URL after "Use This Photo". */
  onSelect: (url: string) => void | Promise<void>;
}) {
  const [tab, setTab] = useState<"upload" | "library">("upload");
  const [library, setLibrary] = useState<MediaItem[] | null>(null);
  const [q, setQ] = useState("");
  const [chosenUrl, setChosenUrl] = useState<string | null>(null); // library pick
  const [pendingFile, setPendingFile] = useState<File | null>(null); // new upload
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  useEffect(() => () => { if (pendingPreview) URL.revokeObjectURL(pendingPreview); }, [pendingPreview]);

  // The library loads once, when first needed.
  useEffect(() => {
    if (tab !== "library" || library !== null) return;
    fetch("/api/media", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLibrary(Array.isArray(d) ? d.filter((m: MediaItem) => m.type === "image") : []))
      .catch(() => setLibrary([]));
  }, [tab, library]);

  const shown = useMemo(
    () => (library ?? []).filter((m) => m.name.toLowerCase().includes(q.toLowerCase())),
    [library, q]
  );

  const pickFile = (file: File) => {
    setProblem(null);
    if (!ACCEPTED.includes(file.type)) {
      setProblem("That file type won't work here. Please choose a JPG, PNG or WebP photo.");
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setProblem(`This photo is too large. Please choose a photo smaller than ${MAX_PHOTO_MB} MB.`);
      return;
    }
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setChosenUrl(null);
  };

  const previewUrl = pendingPreview ?? chosenUrl;

  const useThisPhoto = async () => {
    setProblem(null);
    try {
      if (pendingFile) {
        setBusy("Uploading photo…");
        const optimized = await optimize(pendingFile);
        const fd = new FormData();
        fd.append("file", optimized);
        fd.append("folder", folder);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error || "The upload didn't finish — please try again.");
        setBusy("Saving…");
        await onSelect(body.url as string);
      } else if (chosenUrl) {
        setBusy("Saving…");
        await onSelect(chosenUrl);
      }
      onClose();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Something went wrong — please try again.");
    } finally {
      setBusy(null);
    }
  };

  const tabCls = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? "bg-ink text-white" : "bg-ivory text-charcoal hover:bg-mist/60"}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Change photo">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" />
      <div className="relative flex max-h-[94svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl2 border border-mist bg-white shadow-lift sm:rounded-xl2">
        <div className="flex items-center justify-between border-b border-mist px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Change Photo</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-lg text-slate2 hover:bg-ivory hover:text-ink"><X className="h-4.5 w-4.5" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* Where the photo goes — before anything else. */}
          <p className="flex items-start gap-2 rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-900">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span><span className="font-semibold">Where will this photo appear?</span><br />{location}</span>
          </p>

          <div className="mt-4 flex gap-2">
            <button className={tabCls(tab === "upload")} onClick={() => setTab("upload")}>Upload new photo</button>
            <button className={tabCls(tab === "library")} onClick={() => setTab("library")}>Select existing photo</button>
          </div>

          {tab === "upload" ? (
            <div className="mt-4">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])} />
              <button onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) pickFile(e.dataTransfer.files[0]); }}
                className="grid w-full place-items-center gap-2 rounded-xl2 border-2 border-dashed border-mist bg-ivory/60 py-9 text-center transition-colors hover:border-teal-600 hover:bg-teal-50/50">
                <UploadCloud className="h-6 w-6 text-teal-600" />
                <span className="text-sm font-medium text-ink">{pendingFile ? "Choose a different photo" : "Choose a photo, or drag & drop it here"}</span>
                <span className="text-xs text-slate2">
                  {recommended && <>Best size: {recommended} · </>}JPG, PNG or WebP · smaller than {MAX_PHOTO_MB} MB
                </span>
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <label className="relative block max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate2" aria-hidden />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search photos…"
                  className="h-10 w-full rounded-lg border border-mist bg-white pl-9 pr-3 text-sm focus:border-teal-600" />
              </label>
              {library === null ? (
                <Loading label="Loading photos…" />
              ) : shown.length === 0 ? (
                <NoResults title={q ? "No photos match" : "No photos uploaded yet"}
                  hint={q ? "Try a different word." : "Use “Upload new photo” to add the first one."} />
              ) : (
                <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {shown.map((m) => {
                    const selected = chosenUrl === m.url;
                    return (
                      <li key={m.url}>
                        <button
                          onClick={() => { setChosenUrl(m.url); setPendingFile(null); if (pendingPreview) { URL.revokeObjectURL(pendingPreview); setPendingPreview(null); } }}
                          className={`relative block aspect-square w-full overflow-hidden rounded-lg border-2 transition-colors ${selected ? "border-teal-600" : "border-transparent hover:border-mist"}`}
                          aria-pressed={selected}
                          title={m.name}
                        >
                          <Image src={m.url} alt={m.name} fill sizes="20vw" className="object-cover"
                            unoptimized={m.url.startsWith("/uploads/")} />
                          {selected && (
                            <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-teal-600 text-white"><Check className="h-3.5 w-3.5" /></span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Preview of the chosen photo, before anything is saved. */}
          {previewUrl && (
            <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Preview</p>
              <div className="mt-2 flex items-start gap-3">
                <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg border border-mist bg-ivory">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview of the chosen photo" className="h-full w-full object-cover" />
                </div>
                <p className="text-xs text-slate2">
                  This photo will appear at:<br /><strong className="font-medium text-ink">{location}</strong>
                </p>
              </div>
            </div>
          )}

          {problem && (
            <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{problem}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-mist bg-white px-5 py-4">
          {busy && <span role="status" className="mr-auto text-sm text-teal-800">{busy}</span>}
          <Button variant="outline" size="sm" onClick={onClose} disabled={!!busy}>Cancel</Button>
          <Button size="sm" onClick={useThisPhoto} disabled={!previewUrl || !!busy} loading={!!busy}>
            <ImagePlus className="h-4 w-4" /> Use This Photo
          </Button>
        </div>
      </div>
    </div>
  );
}
