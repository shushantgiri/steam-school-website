import { NextResponse } from "next/server";
import { RoleError, requireArea } from "@/lib/roles";
import { createBatch, listBatches, normalizeSubjects } from "@/lib/results";
import { isValidBs } from "@/lib/bs-calendar";
import { enabledClassNames, getAcademics } from "@/lib/academics";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (e: unknown) =>
  e instanceof RoleError
    ? NextResponse.json({ error: e.message }, { status: e.status })
    : NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });

/** Staff list of result batches — ?page=&search=&class=&year=&exam=&status= */
export async function GET(req: Request) {
  try {
    await requireArea("results");
    const p = new URL(req.url).searchParams;
    const size = Number(p.get("pageSize"));
    const data = await listBatches({
      page: Math.max(1, Number(p.get("page")) || 1),
      pageSize: [25, 50, 100].includes(size) ? size : 25,
      search: p.get("search") ?? undefined,
      klass: p.get("class") ?? undefined,
      year: p.get("year") ?? undefined,
      exam: p.get("exam") ?? undefined,
      status: p.get("status") === "Published" || p.get("status") === "Draft"
        ? (p.get("status") as "Published" | "Draft")
        : undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}

/** Create a result batch (Step 1 of the upload flow). Starts as Draft. */
export async function POST(req: Request) {
  try {
    const actor = await requireArea("results");
    let b: Record<string, unknown>;
    try { b = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

    const title = typeof b.title === "string" ? b.title.trim().slice(0, 120) : "";
    const klass = typeof b.class === "string" ? b.class.trim() : "";
    const exam = typeof b.examination_name === "string" ? b.examination_name.trim() : "";
    const year = typeof b.academic_year === "string" ? b.academic_year.trim() : "";
    const description = typeof b.description === "string" ? b.description.trim().slice(0, 500) : "";
    const subjects = normalizeSubjects(b.subjects);
    const issue_date_bs = typeof b.issue_date_bs === "string" && isValidBs(b.issue_date_bs.trim()) ? b.issue_date_bs.trim() : "";

    if (title.length < 3) return NextResponse.json({ error: "Enter a result title, e.g. Annual Examination Result 2082." }, { status: 400 });
    const setup = await getAcademics();
    if (!enabledClassNames(setup).includes(klass)) return NextResponse.json({ error: "Choose a class from the list." }, { status: 400 });
    if (!setup.examinations.includes(exam)) return NextResponse.json({ error: "Choose an examination from the list." }, { status: 400 });
    if (!setup.academicYears.includes(year)) return NextResponse.json({ error: "Choose an academic year from the list." }, { status: 400 });

    const batch = await createBatch({ title, class: klass, examination_name: exam, academic_year: year, description, subjects, issue_date_bs }, actor);
    await logActivity(actor, `Created result batch "${title}" (${klass}, ${year})`, "Results");
    return NextResponse.json(batch, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
