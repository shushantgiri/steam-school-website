import { NextResponse } from "next/server";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Non-sensitive settings the public site may read (error wording, maintenance flag, logo). */
export async function GET() {
  const s = await getSettings();
  return NextResponse.json({ errorPages: s.errorPages, maintenance: { enabled: s.maintenance.enabled }, logoUrl: s.logoUrl });
}
