import { NextResponse } from "next/server";
import { RoleError, requireArea } from "@/lib/roles";
import { getHomepage } from "@/lib/homepage";
import { getAbout } from "@/lib/about";
import { getSiteImageOverrides, siteImageSlot } from "@/lib/site-images";
import { getNews, getNotices, getEvents, getSettings } from "@/lib/data";
import { getStaff } from "@/lib/staff";
import { getAlbums } from "@/lib/gallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/media/usage?url=… → { usedIn: string[] }
 * Everywhere a photo is used on the website, in plain language
 * ("Homepage → Hero", "News → Sports Day results", …). The delete flow
 * calls this first so nobody removes a photo that is live without knowing.
 */
export async function GET(req: Request) {
  try {
    await requireArea("media");
    const url = new URL(req.url).searchParams.get("url")?.trim();
    if (!url) return NextResponse.json({ error: "Which photo?" }, { status: 400 });

    const usedIn: string[] = [];
    const is = (v: unknown) => typeof v === "string" && v.trim() === url;

    const checks: Array<Promise<void>> = [
      getHomepage().then((h) => {
        if (is(h.hero.image)) usedIn.push("Homepage → Hero (opening photo)");
        if (is(h.about.image)) usedIn.push("Homepage → About the School");
        if (is(h.video.image)) usedIn.push("Homepage → School video poster");
      }),
      getAbout().then((a) => {
        if (is(a.intro.image)) usedIn.push("About page → School introduction");
        if (is(a.philosophy.image)) usedIn.push("About page → Educational philosophy");
        if (is(a.principal.photo)) usedIn.push("About page → Principal's photo");
      }),
      getSiteImageOverrides().then((ov) => {
        for (const [id, v] of Object.entries(ov)) {
          if (v === url) usedIn.push(siteImageSlot(id)?.location ?? "Website photo slot");
        }
      }),
      getNews().then((xs) => xs.forEach((n) => { if (is(n.image)) usedIn.push(`News → ${n.title}`); })),
      getNotices().then((xs) => xs.forEach((n) => { if (is((n as { image?: string }).image)) usedIn.push(`Notices → ${n.title}`); })),
      getEvents().then((xs) => xs.forEach((e) => { if (is(e.image)) usedIn.push(`Events → ${e.title}`); })),
      getStaff().then((xs) => xs.forEach((m) => { if (is(m.photo)) usedIn.push(`Teachers & Staff → ${m.name}`); })),
      getAlbums().then((albums) =>
        albums.forEach((a) => {
          if (a.photos.some((p) => is(p.src))) usedIn.push(`Gallery → ${a.name}`);
        })
      ),
      getSettings().then((s) => {
        const raw = JSON.stringify(s);
        if (raw.includes(url)) usedIn.push("Settings (logo or documents)");
      }),
    ];
    await Promise.all(checks.map((p) => p.catch(() => undefined)));

    return NextResponse.json({ usedIn });
  } catch (e) {
    return e instanceof RoleError
      ? NextResponse.json({ error: e.message }, { status: e.status })
      : NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });
  }
}
