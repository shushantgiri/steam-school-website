import { NextResponse } from "next/server";
import { RoleError, requireArea } from "@/lib/roles";
import { countBatchDuplicates, getBatch, importIntoBatch, type ImportMode } from "@/lib/results";
import { parseCsv, validateCsv } from "@/lib/results-csv";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_CSV_BYTES = 2 * 1024 * 1024; // plenty for thousands of rows
const MAX_ROWS = 5000;

/**
 * POST { batch_id, csv, mode: "check" | "skip" | "update" }
 * The server re-parses and re-validates the CSV itself — the browser preview
 * is a courtesy, never the security boundary. "check" answers "how many of
 * these already exist in the batch?" without writing anything, so the UI can
 * ask Skip/Update BEFORE the import. Only valid rows are imported; the
 * response reports inserted / updated / skipped / rejected precisely.
 */
export async function POST(req: Request) {
  try {
    const actor = await requireArea("results");
    let b: { batch_id?: unknown; csv?: unknown; mode?: unknown };
    try { b = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

    const batchId = typeof b.batch_id === "string" ? b.batch_id : "";
    const csv = typeof b.csv === "string" ? b.csv : "";
    const mode = b.mode === "update" ? "update" : b.mode === "check" ? "check" : "skip";
    if (!batchId) return NextResponse.json({ error: "Missing batch." }, { status: 400 });
    const batch = await getBatch(batchId);
    if (!batch) return NextResponse.json({ error: "Result batch not found." }, { status: 404 });
    if (!csv.trim()) return NextResponse.json({ error: "The CSV file is empty." }, { status: 400 });
    if (csv.length > MAX_CSV_BYTES) return NextResponse.json({ error: "CSV too large — split it into smaller files." }, { status: 413 });

    const report = validateCsv(parseCsv(csv), batch.subjects);
    if (!report.header_ok) {
      return NextResponse.json(
        { error: `The CSV is missing required columns: ${report.missing_columns.join(", ")}. Download the template and try again.` },
        { status: 400 }
      );
    }
    if (report.valid.length === 0) {
      return NextResponse.json({ error: "No valid rows found in the CSV.", issues: report.issues }, { status: 400 });
    }
    if (report.valid.length > MAX_ROWS) {
      return NextResponse.json({ error: `Too many rows (${report.valid.length}). Import at most ${MAX_ROWS} at a time.` }, { status: 413 });
    }

    if (mode === "check") {
      const duplicates = await countBatchDuplicates(batchId, report.valid);
      return NextResponse.json({ valid: report.valid.length, duplicates, rejected: report.issues.length, issues: report.issues });
    }

    const outcome = await importIntoBatch(batchId, report.valid, mode as ImportMode, actor);
    await logActivity(
      actor,
      `Imported ${outcome.inserted} results into ${batch.title} (${batch.class}) — ${outcome.updated} updated, ${outcome.skipped} duplicates skipped, ${report.issues.length} rows rejected`,
      "Results"
    );
    return NextResponse.json({ ...outcome, rejected: report.issues.length, issues: report.issues });
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: e instanceof Error ? e.message : "Import failed." }, { status: 500 });
  }
}
