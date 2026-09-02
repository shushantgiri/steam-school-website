import { NextResponse } from "next/server";
import { RoleError, requireArea } from "@/lib/roles";
import { deleteBatch, getBatch, listBatchResults, normalizeSubjects, patchBatch } from "@/lib/results";
import { isValidBs } from "@/lib/bs-calendar";
import { enabledClassNames, getAcademics } from "@/lib/academics";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (e: unknown) =>
  e instanceof RoleError
    ? NextResponse.json({ error: e.message }, { status: e.status })
    : NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });

/** One batch + a page of its results — ?page=&pageSize=&search= */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireArea("results");
    const batch = await getBatch(params.id);
    if (!batch) return NextResponse.json({ error: "Result batch not found." }, { status: 404 });
    const p = new URL(req.url).searchParams;
    const size = Number(p.get("pageSize"));
    const results = await listBatchResults(params.id, {
      page: Math.max(1, Number(p.get("page")) || 1),
      pageSize: [25, 50, 100].includes(size) ? size : 25,
      search: p.get("search") ?? undefined,
    });
    return NextResponse.json({ batch, results });
  } catch (e) {
    return fail(e);
  }
}

/** Edit batch details or publish/unpublish it. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireArea("results");
    let b: Record<string, unknown>;
    try { b = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }

    const fields: Record<string, unknown> = {};
    if (typeof b.title === "string") {
      const t = b.title.trim().slice(0, 120);
      if (t.length < 3) return NextResponse.json({ error: "The result title is too short." }, { status: 400 });
      fields.title = t;
    }
    if (typeof b.description === "string") fields.description = b.description.trim().slice(0, 500);
    if (typeof b.published === "boolean") fields.published = b.published;
    if (b.subjects !== undefined) fields.subjects = normalizeSubjects(b.subjects);
    if (typeof b.issue_date_bs === "string") {
      const d = b.issue_date_bs.trim();
      if (d && !isValidBs(d)) return NextResponse.json({ error: "Issue date must be a valid BS date." }, { status: 400 });
      fields.issue_date_bs = d;
    }

    const setup = await getAcademics();
    if (typeof b.class === "string") {
      if (!enabledClassNames(setup).includes(b.class)) return NextResponse.json({ error: "Choose a class from the list." }, { status: 400 });
      fields.class = b.class;
    }
    if (typeof b.examination_name === "string") {
      if (!setup.examinations.includes(b.examination_name)) return NextResponse.json({ error: "Choose an examination from the list." }, { status: 400 });
      fields.examination_name = b.examination_name;
    }
    if (typeof b.academic_year === "string") {
      if (!setup.academicYears.includes(b.academic_year)) return NextResponse.json({ error: "Choose an academic year from the list." }, { status: 400 });
      fields.academic_year = b.academic_year;
    }
    if (Object.keys(fields).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

    const updated = await patchBatch(params.id, fields, actor);
    if (!updated) return NextResponse.json({ error: "Result batch not found." }, { status: 404 });
    if (typeof fields.published === "boolean") {
      await logActivity(actor, `${fields.published ? "Published" : "Unpublished"} ${updated.title} (${updated.class})`, "Results");
    } else {
      await logActivity(actor, `Edited result batch ${updated.title} (${updated.class})`, "Results");
    }
    return NextResponse.json(updated);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireArea("results");
    const batch = await getBatch(params.id);
    const ok = await deleteBatch(params.id);
    if (!ok) return NextResponse.json({ error: "Result batch not found." }, { status: 404 });
    await logActivity(actor, `Deleted result batch ${batch?.title ?? params.id} and its ${batch?.student_count ?? 0} results`, "Results");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
