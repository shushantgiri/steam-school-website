import { NextResponse } from "next/server";
import { RoleError, requireArea } from "@/lib/roles";
import { SITE_IMAGE_SLOTS, getSiteImageOverrides, saveSiteImage, siteImageSlot } from "@/lib/site-images";
import { getHomepage, saveHomepage } from "@/lib/homepage";
import { getAbout, saveAbout } from "@/lib/about";
import { getSettings, FILES } from "@/lib/data";
import { writeJson } from "@/lib/store";
import { img } from "@/lib/images";
import { logActivity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Photo slots for the Media Library. One list, every built-in photo location
 * on the website — including the slots whose photos live in the Homepage and
 * About stores. PUT { id, url } changes a slot ("" resets to the default).
 */

export type PhotoSlot = {
  id: string;
  label: string;
  page: string;
  location: string;
  viewHref: string;
  recommended: string;
  /** Photo currently shown on the website (override or built-in default). */
  url: string;
  /** True when the admin has set their own photo. */
  overridden: boolean;
};

/** Slots stored in homepage.json / about.json rather than site-images.json. */
const STORE_SLOTS: Array<Omit<PhotoSlot, "url" | "overridden"> & { defaultUrl: string }> = [
  { id: "site-logo", label: "School logo", page: "Whole website", location: "Whole website → Header, footer and documents", viewHref: "/", recommended: "512 × 512 px (square)", defaultUrl: "" },
  { id: "home-hero", label: "Hero — the big opening photo", page: "Homepage", location: "Homepage → Hero (opening screen)", viewHref: "/", recommended: "1920 × 1080 px", defaultUrl: img.hero },
  { id: "home-about-photo", label: "About the School photo", page: "Homepage", location: "Homepage → About the School section", viewHref: "/", recommended: "1600 × 1200 px", defaultUrl: img.about },
  { id: "home-video-poster", label: "School video poster", page: "Homepage", location: "Homepage → School video (shown before play)", viewHref: "/", recommended: "1600 × 900 px", defaultUrl: img.event },
  { id: "about-intro", label: "School introduction photo", page: "About", location: "About page → School introduction", viewHref: "/about", recommended: "1600 × 1200 px", defaultUrl: img.about },
  { id: "about-philosophy", label: "Educational philosophy photo", page: "About", location: "About page → Educational philosophy", viewHref: "/about", recommended: "1600 × 1200 px", defaultUrl: img.lab },
  { id: "about-principal", label: "Photo of the principal", page: "About", location: "About page → Principal's message", viewHref: "/about", recommended: "800 × 800 px", defaultUrl: "" },
];
const STORE_SLOT_IDS = new Set(STORE_SLOTS.map((s) => s.id));

const fail = (e: unknown) =>
  e instanceof RoleError
    ? NextResponse.json({ error: e.message }, { status: e.status })
    : NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });

async function allSlots(): Promise<PhotoSlot[]> {
  const [overrides, home, about, settings] = await Promise.all([getSiteImageOverrides(), getHomepage(), getAbout(), getSettings()]);
  const storeValue: Record<string, string> = {
    "site-logo": settings.logoUrl,
    "home-hero": home.hero.image,
    "home-about-photo": home.about.image,
    "home-video-poster": home.video.image,
    "about-intro": about.intro.image,
    "about-philosophy": about.philosophy.image,
    "about-principal": about.principal.photo,
  };
  const fromStores: PhotoSlot[] = STORE_SLOTS.map(({ defaultUrl, ...s }) => ({
    ...s,
    url: storeValue[s.id] || defaultUrl,
    overridden: !!storeValue[s.id],
  }));
  const fromRegistry: PhotoSlot[] = SITE_IMAGE_SLOTS.map((s) => ({
    id: s.id, label: s.label, page: s.page, location: s.location,
    viewHref: s.viewHref, recommended: s.recommended,
    url: overrides[s.id] || s.defaultUrl,
    overridden: !!overrides[s.id],
  }));
  // Whole-website slots first, then Homepage, then the rest in registry order.
  const rank = (p: string) => (p === "Whole website" ? 0 : p === "Homepage" ? 1 : 2);
  return [...fromStores, ...fromRegistry].sort((a, b) => rank(a.page) - rank(b.page));
}

export async function GET() {
  try {
    await requireArea("media");
    return NextResponse.json(await allSlots());
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(req: Request) {
  try {
    const actor = await requireArea("homepage");
    let body: { id?: unknown; url?: unknown };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected a JSON object." }, { status: 400 }); }
    const id = typeof body.id === "string" ? body.id : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!id) return NextResponse.json({ error: "Which photo slot?" }, { status: 400 });

    if (STORE_SLOT_IDS.has(id)) {
      if (id === "site-logo") {
        const settings = await getSettings();
        await writeJson(FILES.settings, { ...settings, logoUrl: url });
      } else if (id.startsWith("home-")) {
        const home = await getHomepage();
        if (id === "home-hero") home.hero.image = url;
        if (id === "home-about-photo") home.about.image = url;
        if (id === "home-video-poster") home.video.image = url;
        await saveHomepage(home);
      } else {
        const about = await getAbout();
        if (id === "about-intro") about.intro.image = url;
        if (id === "about-philosophy") about.philosophy.image = url;
        if (id === "about-principal") about.principal.photo = url;
        await saveAbout(about);
      }
    } else if (siteImageSlot(id)) {
      await saveSiteImage(id, url);
    } else {
      return NextResponse.json({ error: "Unknown photo slot." }, { status: 404 });
    }

    const slots = await allSlots();
    const changed = slots.find((s) => s.id === id);
    await logActivity(actor, `${url ? "Changed" : "Reset"} photo: ${changed?.location ?? id}`, "Media");
    return NextResponse.json(changed);
  } catch (e) {
    return fail(e);
  }
}
