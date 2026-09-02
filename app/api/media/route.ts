import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { MEDIA_BUCKET, deleteUpload } from "@/lib/uploads";
import { logActivity } from "@/lib/records";
import { RoleError, requireArea } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type MediaItem = {
  name: string;
  folder: string;
  url: string;
  size: number;
  type: "image" | "document";
  created_at: string;
};

const guard = async () => requireArea("media");
const fail = (e: unknown) =>
  e instanceof RoleError
    ? NextResponse.json({ error: e.message }, { status: e.status })
    : NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });

const kind = (name: string): "image" | "document" =>
  /\.pdf$/i.test(name) ? "document" : "image";

/** Every uploaded file, newest first — Supabase Storage or public/uploads. */
export async function GET() {
  try {
    await guard();
    const items: MediaItem[] = [];

    if (isSupabaseConfigured()) {
      const storage = supabaseAdmin().storage.from(MEDIA_BUCKET);
      const { data: folders, error } = await storage.list("", { limit: 100 });
      if (error) throw new Error(error.message);
      for (const f of folders ?? []) {
        if (f.id) continue; // a file at root, not a folder
        const { data: files, error: fErr } = await storage.list(f.name, { limit: 500 });
        if (fErr) continue;
        for (const file of files ?? []) {
          const p = `${f.name}/${file.name}`;
          items.push({
            name: file.name,
            folder: f.name,
            url: storage.getPublicUrl(p).data.publicUrl,
            size: (file.metadata as { size?: number } | null)?.size ?? 0,
            type: kind(file.name),
            created_at: file.created_at ?? "",
          });
        }
      }
    } else {
      const root = path.join(process.cwd(), "public", "uploads");
      let folders: string[] = [];
      try { folders = await fs.readdir(root); } catch { /* nothing uploaded yet */ }
      for (const folder of folders) {
        const dir = path.join(root, folder);
        let stat; try { stat = await fs.stat(dir); } catch { continue; }
        if (!stat.isDirectory()) continue;
        for (const name of await fs.readdir(dir)) {
          const st = await fs.stat(path.join(dir, name));
          items.push({
            name, folder, url: `/uploads/${folder}/${name}`,
            size: st.size, type: kind(name), created_at: st.mtime.toISOString(),
          });
        }
      }
    }

    items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json(items);
  } catch (e) {
    return fail(e);
  }
}

/** DELETE ?url=… — removes the file itself. */
export async function DELETE(req: Request) {
  try {
    const actor = await guard();
    const url = new URL(req.url).searchParams.get("url");
    if (!url) return NextResponse.json({ error: "Which file?" }, { status: 400 });
    await deleteUpload(url);
    await logActivity(actor, `Deleted media file ${url.split("/").pop()}`, "Media");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
