import { NextResponse } from "next/server";
import { requireArea, RoleError } from "@/lib/roles";
import { getMarksheet } from "@/lib/results";
import { getSettings } from "@/lib/data";
import { buildMarksheet } from "@/lib/marksheet";
import { verifyMarksheetToken } from "@/lib/marksheet-token";
import { renderMarksheetPdf } from "@/lib/marksheet-pdf";
import { readFile } from "fs/promises";
import path from "path";

/**
 * The PDF renderer cannot load site-relative paths. Files served from
 * /public (the built-in logo, local uploads) are inlined as data URLs;
 * absolute URLs (Supabase storage) are passed through.
 */
async function inlineIfLocal(url: string): Promise<string> {
  if (!url || !url.startsWith("/")) return url;
  try {
    const file = path.join(process.cwd(), "public", url.split("?")[0]);
    const buf = await readFile(file);
    const ext = path.extname(file).slice(1).toLowerCase();
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/marksheet/:id            → marksheet as JSON (for the on-screen sheet)
 * GET /api/marksheet/:id?format=pdf → the A4 PDF, as a download
 *
 * Access: a staff session with the "results" area, OR a valid family token
 * (`?t=`) issued by the public result search for exactly this result. With a
 * token, only PUBLISHED batches are readable; staff may preview drafts.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const wantPdf = url.searchParams.get("format") === "pdf";

  let staff = false;
  try { await requireArea("results"); staff = true; } catch (e) { if (!(e instanceof RoleError)) throw e; }

  if (!staff && !(await verifyMarksheetToken(params.id, token))) {
    return NextResponse.json({ error: "This marksheet link is not valid. Search for the result again to get a fresh link." }, { status: 403 });
  }

  try {
    const rec = await getMarksheet(params.id, !staff);
    if (!rec) return NextResponse.json({ error: "Marksheet not available for this result." }, { status: 404 });
    const view = buildMarksheet(rec, await getSettings());

    if (!wantPdf) return NextResponse.json(view);

    const pdfView = {
      ...view,
      school: { ...view.school, logoUrl: await inlineIfLocal(view.school.logoUrl) },
      signatures: {
        ...view.signatures,
        principal: { ...view.signatures.principal, image: await inlineIfLocal(view.signatures.principal.image) },
        classTeacher: { ...view.signatures.classTeacher, image: await inlineIfLocal(view.signatures.classTeacher.image) },
      },
    };
    const pdf = await renderMarksheetPdf(pdfView);
    const safe = `${view.student.name} - ${view.exam.examination} ${view.exam.academicYear}`.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-");
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Grade-Sheet-${safe || "marksheet"}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not build the marksheet." }, { status: 500 });
  }
}
