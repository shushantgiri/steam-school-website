import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";

/**
 * File uploads. Supabase mode stores in the public `school-media` bucket;
 * local mode stores under public/uploads. Both return a browser-usable URL.
 */

export const MEDIA_BUCKET = "school-media";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};
const DOC_TYPES: Record<string, string> = { "application/pdf": "pdf" };

export function extensionFor(mime: string, allowDocs: boolean): string | null {
  return IMAGE_TYPES[mime] ?? (allowDocs ? DOC_TYPES[mime] ?? null : null);
}

export async function saveUpload(
  file: File,
  folder: string,
  ext: string
): Promise<{ url: string; name: string }> {
  const name = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (isSupabaseConfigured()) {
    const { error } = await supabaseAdmin()
      .storage.from(MEDIA_BUCKET)
      .upload(name, bytes, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    const { data } = supabaseAdmin().storage.from(MEDIA_BUCKET).getPublicUrl(name);
    return { url: data.publicUrl, name };
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });
  const base = path.basename(name);
  await fs.writeFile(path.join(dir, base), bytes);
  return { url: `/uploads/${folder}/${base}`, name };
}

/** Best-effort delete; a missing file never breaks the calling action. */
export async function deleteUpload(url: string): Promise<void> {
  try {
    if (isSupabaseConfigured() && !url.startsWith("/uploads/")) {
      const marker = `/object/public/${MEDIA_BUCKET}/`;
      const i = url.indexOf(marker);
      if (i === -1) return; // external image (e.g. Unsplash seed) — leave it
      await supabaseAdmin().storage.from(MEDIA_BUCKET).remove([decodeURIComponent(url.slice(i + marker.length))]);
      return;
    }
    if (url.startsWith("/uploads/")) {
      await fs.unlink(path.join(process.cwd(), "public", url));
    }
  } catch {
    /* non-fatal */
  }
}
