import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAlbums, updateAlbums, type GalleryAlbum } from "@/lib/gallery";
import { logActivity } from "@/lib/records";
import { requireArea, RoleError } from "@/lib/roles";
import { STATUSES, type Status } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getAlbums());
}

/** Create an album: { name } */
export async function POST(req: Request) {
  try {
    await requireArea("gallery");
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: "Permission check failed." }, { status: 500 });
  }

  let body: { name?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Give the album a name." }, { status: 400 });

  const album: GalleryAlbum = { id: `al_${randomUUID().slice(0, 8)}`, name, status: "Draft" as Status, cover: "", photos: [] };
  await updateAlbums((albums) => [album, ...albums]);
  await logActivity("Admin", `Created album — ${name}`, "Gallery");
  return NextResponse.json(album, { status: 201 });
}
