import { NextResponse } from "next/server";
import { activity } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json((await activity.list()).slice(0, 30));
}
