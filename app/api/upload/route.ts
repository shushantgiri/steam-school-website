import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, authSecret, verifySessionToken } from "@/lib/auth-token";
import { extensionFor, MAX_UPLOAD_BYTES, saveUpload } from "@/lib/uploads";
import { logActivity } from "@/lib/records";
import { RoleError, requireArea } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FOLDERS = new Set(["gallery", "news", "notices", "events", "admissions", "homepage", "about", "academics", "facilities", "student-life", "staff", "logo", "signatures", "other"]);

/** Which CMS area a folder belongs to — uploads follow the same permissions as the pages that use them. */
const FOLDER_AREA: Record<string, Parameters<typeof requireArea>[0]> = {
  gallery: "gallery",
  news: "content", notices: "content", events: "content", staff: "content",
  homepage: "homepage", about: "homepage",
  academics: "homepage", facilities: "homepage", "student-life": "homepage",
  admissions: "admissions",
  logo: "homepage", signatures: "settings",
  other: "media",
};

/**
 * POST multipart/form-data: file (+ optional folder, docs="1" for PDFs).
 * Visitors (no session) may ONLY upload admission documents — the admission
 * form needs this. Staff uploads are role-checked per folder.
 */
export async function POST(req: Request) {
  const session = await verifySessionToken(authSecret(), cookies().get(SESSION_COOKIE)?.value);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Attach a file to upload." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Files can be up to 10 MB." }, { status: 413 });
  }

  let folder = String(form.get("folder") ?? "other");
  if (!FOLDERS.has(folder)) folder = "other";
  let allowDocs = form.get("docs") === "1";

  if (!session) {
    // Public path: admission documents only, nothing else.
    folder = "admissions";
    allowDocs = true;
  } else {
    try {
      await requireArea(FOLDER_AREA[folder] ?? "media");
    } catch (e) {
      return e instanceof RoleError
        ? NextResponse.json({ error: e.message }, { status: e.status })
        : NextResponse.json({ error: "Permission check failed." }, { status: 500 });
    }
  }

  const ext = extensionFor(file.type, allowDocs);
  if (!ext) {
    return NextResponse.json(
      { error: allowDocs ? "Use a JPG, PNG, WebP image or a PDF." : "Use a JPG, PNG or WebP image." },
      { status: 415 }
    );
  }

  try {
    const saved = await saveUpload(file, folder, ext);
    if (session) await logActivity(session.sub, `Uploaded ${file.name}`, "Media");
    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed — try again." },
      { status: 500 }
    );
  }
}
