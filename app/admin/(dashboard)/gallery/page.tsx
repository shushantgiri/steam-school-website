"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, UploadCloud, Star, Trash2, ArrowLeft, ArrowRight, ChevronLeft } from "lucide-react";
import { PageHeader, Card, Status, Loading, ErrorNotice, NoResults } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client-api";
import { askConfirm, askInput, toast } from "@/components/admin/Feedback";
import type { GalleryAlbum } from "@/lib/gallery";

const CATEGORIES = ["School Life", "STEAM", "Sports", "Events", "Classroom", "Trips", "Competitions", "Cultural Programs"];

export default function AdminGallery() {
  const [albums, setAlbums] = useState<GalleryAlbum[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setError(null);
    try {
      setAlbums(await api.get<GalleryAlbum[]>("/api/gallery"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the gallery.");
    }
  };
  useEffect(() => { load(); }, []);

  const rows = albums ?? [];
  const open = rows.find((a) => a.id === openId);

  const replaceAlbum = (updated: GalleryAlbum) =>
    setAlbums((xs) => (xs ?? []).map((a) => (a.id === updated.id ? updated : a)));

  const patch = async (id: string, body: Record<string, unknown>) => {
    try {
      replaceAlbum(await api.patch<GalleryAlbum>(`/api/gallery/${id}`, body));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that change.");
    }
  };

  const createAlbum = async () => {
    const name = await askInput({ title: "Create album", label: "Album name", placeholder: "e.g. Sports Day 2083" });
    if (!name) return;
    try {
      const album = await api.post<GalleryAlbum>("/api/gallery", { name: name.trim() });
      setAlbums((xs) => [album, ...(xs ?? [])]);
      setOpenId(album.id);
      toast(`Album “${album.name}” created.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the album.");
    }
  };

  const deleteAlbum = async (id: string) => {
    const ok = await askConfirm({
      title: "Delete this album?",
      body: "Every photo in it is removed from the website. This cannot be undone.",
      confirmLabel: "Delete Album", danger: true,
    });
    if (!ok) return;
    try {
      await api.del(`/api/gallery/${id}`);
      setAlbums((xs) => (xs ?? []).filter((a) => a.id !== id));
      setOpenId(null);
      toast("Album deleted.", "info");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the album.");
    }
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (!open) return;
    const list = Array.from(files);
    const added: Array<{ src: string; alt: string; category: string }> = [];
    setError(null);
    for (let i = 0; i < list.length; i++) {
      setProgress(`Uploading ${i + 1} of ${list.length}…`);
      const fd = new FormData();
      fd.append("file", list[i]);
      fd.append("folder", "gallery");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || `"${list[i].name}" failed to upload.`);
        continue;
      }
      added.push({ src: data.url as string, alt: list[i].name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "), category });
    }
    setProgress(null);
    if (added.length) await patch(open.id, { addPhotos: added });
    if (fileRef.current) fileRef.current.value = "";
  };

  const move = (photoId: string, dir: -1 | 1) => {
    if (!open) return;
    const ids = open.photos.map((p) => p.id);
    const i = ids.indexOf(photoId);
    const j = i + dir;
    if (i === -1 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    patch(open.id, { order: ids });
  };

  if (open) {
    return (
      <div>
        <button onClick={() => setOpenId(null)} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate2 hover:text-ink">
          <ChevronLeft className="h-4 w-4" /> All albums
        </button>
        <PageHeader title={open.name} lead={`${open.photos.length} photo${open.photos.length === 1 ? "" : "s"} · ${open.status === "Published" ? "visible on the website" : "hidden until published"}`}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant={open.status === "Published" ? "outline" : "primary"} size="sm"
                onClick={() => patch(open.id, { status: open.status === "Published" ? "Draft" : "Published" })}>
                {open.status === "Published" ? "Unpublish" : "Publish"}
              </Button>
              <Button variant="outline" size="sm" onClick={async () => {
                const name = await askInput({ title: "Rename album", label: "Album name", initial: open.name });
                if (name) patch(open.id, { name });
              }}>Rename</Button>
              <Button variant="outline" size="sm" className="!border-red-200 !text-red-600 hover:!bg-red-50" onClick={() => deleteAlbum(open.id)}>
                <Trash2 className="h-4 w-4" /> Delete Album
              </Button>
            </div>
          } />
        {error && <ErrorNotice message={error} />}
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-charcoal">
              New photos go to:{" "}
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="ml-1 h-9 rounded-lg border border-mist bg-white px-2 text-sm">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
          <button onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files); }}
            className="mt-4 grid w-full place-items-center gap-2 rounded-xl2 border-2 border-dashed border-mist bg-ivory/60 py-8 text-center transition-colors hover:border-teal-600 hover:bg-teal-50/50">
            <UploadCloud className="h-6 w-6 text-teal-600" />
            <span className="text-sm font-medium text-ink">Drag &amp; drop photos, or click to upload</span>
            <span className="text-xs text-slate2">JPG, PNG or WebP · up to 10 MB each</span>
          </button>
          {progress && (
            <p role="status" aria-live="polite" className="mt-3 text-sm text-teal-800">{progress}</p>
          )}
          {open.photos.length === 0 ? (
            <NoResults title="No photos yet" hint="Upload the first photos of this album." />
          ) : (
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {open.photos.map((p, i) => (
                <li key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border border-mist">
                  <Image src={p.src} alt={p.alt} fill sizes="25vw" className="object-cover" unoptimized={p.src.startsWith("/uploads/")} />
                  <div className="absolute inset-0 flex flex-col justify-between bg-ink/0 p-2 opacity-0 transition group-hover:bg-ink/40 group-hover:opacity-100 group-focus-within:opacity-100">
                    <div className="flex justify-end gap-1.5">
                      <button aria-label="Set as cover" onClick={() => patch(open.id, { cover: p.id })}
                        className={`grid h-8 w-8 place-items-center rounded-lg ${open.cover === p.id ? "bg-sun-400 text-ink" : "bg-white/90 text-ink"}`}>
                        <Star className="h-4 w-4" />
                      </button>
                      <button aria-label="Delete photo" onClick={() => patch(open.id, { removePhoto: p.id })}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="flex justify-between">
                      <button aria-label="Move earlier" onClick={() => move(p.id, -1)} disabled={i === 0}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-ink disabled:opacity-40"><ArrowLeft className="h-4 w-4" /></button>
                      <button aria-label="Move later" onClick={() => move(p.id, 1)} disabled={i === open.photos.length - 1}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-ink disabled:opacity-40"><ArrowRight className="h-4 w-4" /></button>
                    </div>
                  </div>
                  {open.cover === p.id && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-sun-400 px-2 py-0.5 text-[10px] font-bold uppercase text-ink">Cover</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Gallery" lead="Albums power the public Gallery page. Only published albums are visible to families."
        action={<Button onClick={createAlbum}><Plus className="h-4 w-4" /> Create Album</Button>} />
      {error && <ErrorNotice message={error} onRetry={load} />}
      {albums === null && !error ? (
        <Card><Loading label="Loading albums…" /></Card>
      ) : rows.length === 0 ? (
        <Card><NoResults title="No albums yet" hint="Create an album, then upload photos into it." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rows.map((a) => {
            const cover = a.photos.find((p) => p.id === a.cover) ?? a.photos[0];
            return (
              <Card key={a.id} className="!p-4">
                <button onClick={() => setOpenId(a.id)} className="block w-full text-left">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-ivory">
                    {cover ? (
                      <Image src={cover.src} alt="" fill sizes="25vw" className="object-cover" unoptimized={cover.src.startsWith("/uploads/")} />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-slate2">No photos yet</div>
                    )}
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">{a.name}</p>
                      <p className="text-xs text-slate2">{a.photos.length} photo{a.photos.length === 1 ? "" : "s"}</p>
                    </div>
                    <Status value={a.status} />
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
