import { NextResponse } from "next/server";
import { getTestimonials, updateTestimonials, type Testimonial } from "@/lib/testimonials";
import { RoleError, requireArea } from "@/lib/roles";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (e: unknown) =>
  e instanceof RoleError
    ? NextResponse.json({ error: e.message }, { status: e.status })
    : NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });

/** Staff list (drafts included). */
export async function GET() {
  try {
    await requireArea("content");
    return NextResponse.json(await getTestimonials());
  } catch (e) {
    return fail(e);
  }
}

/** Create, update or delete — one endpoint keeps the page simple.
 *  POST { action: "create"|"update"|"delete", testimonial } */
export async function POST(req: Request) {
  try {
    const actor = await requireArea("content");
    let b: { action?: string; testimonial?: Partial<Testimonial> };
    try { b = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
    const t = b.testimonial ?? {};

    if (b.action === "delete") {
      if (!t.id) return NextResponse.json({ error: "Which testimonial?" }, { status: 400 });
      await updateTestimonials((all) => all.filter((x) => x.id !== t.id));
      await logActivity(actor, "Deleted a testimonial", "Content");
      return NextResponse.json({ ok: true });
    }

    const name = (t.name ?? "").toString().trim();
    const role = (t.role ?? "").toString().trim();
    const quote = (t.quote ?? "").toString().trim();
    const status = t.status === "Draft" ? "Draft" : "Published";
    if (!name || !quote) return NextResponse.json({ error: "Name and quote are required." }, { status: 400 });
    if (quote.length > 400) return NextResponse.json({ error: "Keep quotes under 400 characters." }, { status: 400 });

    if (b.action === "update" && t.id) {
      await updateTestimonials((all) =>
        all.map((x) => (x.id === t.id ? { ...x, name, role, quote, status } : x))
      );
      await logActivity(actor, `Updated testimonial from ${name}`, "Content");
    } else {
      const fresh: Testimonial = { id: crypto.randomUUID(), name, role, quote, status };
      await updateTestimonials((all) => [fresh, ...all]);
      await logActivity(actor, `Added testimonial from ${name}`, "Content");
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
