import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves locally uploaded files in production. Next only serves /public assets
 * that existed at build time, so files uploaded while the server runs need
 * this handler. Supabase mode bypasses it entirely (absolute Storage URLs).
 */

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".pdf": "application/pdf",
};

export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const root = path.join(process.cwd(), "public", "uploads");
  const target = path.join(root, ...params.path);
  // Never step outside the uploads directory, whatever the URL says.
  if (!path.resolve(target).startsWith(path.resolve(root) + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const file = await fs.readFile(target);
    const type = TYPES[path.extname(target).toLowerCase()] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(file), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
