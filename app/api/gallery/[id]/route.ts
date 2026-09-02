import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { updateAlbums, type GalleryAlbum, type GalleryPhoto } from "@/lib/gallery";
import { deleteUpload } from "@/lib/uploads";
import { logActivity } from "@/lib/records";
import { requireArea, RoleError } from "@/lib/roles";
import { STATUSES, type Status } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };
const notFound = () => NextResponse.json({ error: "Album not found." }, { status: 404 });

/**
 * PATCH one album. Body may carry any of:
 *   name, status                          — album fields
 *   addPhotos: [{src, alt, category}]     — append uploaded photos
 *   removePhoto: photoId                  — delete one photo (and its file)
 *   cover: photoId                        — set cover
 *   order: [photoId…]                     — reorder photos
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireArea("gallery");
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: "Permission check failed." }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

  let found: GalleryAlbum | undefined;
  let removedSrc: string | null = null;

  await updateAlbums((albums) =>
    albums.map((a) => {
      if (a.id !== params.id) return a;
      const next: GalleryAlbum = { ...a, photos: [...a.photos] };

      if (typeof body.name === "string" && body.name.trim()) next.name = body.name.trim();
      if (typeof body.status === "string" && (STATUSES as string[]).includes(body.status)) {
        next.status = body.status as Status;
      }
      if (Array.isArray(body.addPhotos)) {
        for (const p of body.addPhotos) {
          if (p && typeof p === "object" && typeof (p as any).src === "string") {
            next.photos.push({
              id: `p_${randomUUID().slice(0, 8)}`,
              src: (p as any).src,
              alt: typeof (p as any).alt === "string" ? (p as any).alt : "School photo",
              category: typeof (p as any).category === "string" ? (p as any).category : "School Life",
            });
          }
        }
      }
      if (typeof body.removePhoto === "string") {
        const photo = next.photos.find((p) => p.id === body.removePhoto);
        if (photo) removedSrc = photo.src;
        next.photos = next.photos.filter((p) => p.id !== body.removePhoto);
        if (next.cover === body.removePhoto) next.cover = next.photos[0]?.id ?? "";
      }
      if (typeof body.cover === "string" && next.photos.some((p) => p.id === body.cover)) {
        next.cover = body.cover;
      }
      if (Array.isArray(body.order)) {
        const byId = new Map(next.photos.map((p) => [p.id, p]));
        const ordered = (body.order as unknown[])
          .filter((id): id is string => typeof id === "string")
          .map((id) => byId.get(id))
          .filter((p): p is GalleryPhoto => !!p);
        if (ordered.length === next.photos.length) next.photos = ordered;
      }
      if (!next.cover && next.photos.length) next.cover = next.photos[0].id;
      found = next;
      return next;
    })
  );

  if (!found) return notFound();
  if (removedSrc) await deleteUpload(removedSrc);
  await logActivity("Admin", `Updated album — ${found.name}`, "Gallery");
  return NextResponse.json(found);
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireArea("gallery");
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: "Permission check failed." }, { status: 500 });
  }

  let removed: GalleryAlbum | undefined;
  await updateAlbums((albums) => {
    removed = albums.find((a) => a.id === params.id);
    return albums.filter((a) => a.id !== params.id);
  });
  if (!removed) return notFound();
  await Promise.all(removed.photos.map((p) => deleteUpload(p.src)));
  await logActivity("Admin", `Deleted album — ${removed.name}`, "Gallery");
  return NextResponse.json({ ok: true });
}
