import { requireArea, RoleError } from "@/lib/roles";
import { NextResponse } from "next/server";
import { createInCollection, listCollection } from "@/lib/collection-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return listCollection("notices");
}

export function POST(req: Request) {
  return createInCollection("notices", req);
}
