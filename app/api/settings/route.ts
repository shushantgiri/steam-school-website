import { requireArea, RoleError } from "@/lib/roles";
import { readSettings, saveSettings } from "@/lib/collection-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return readSettings();
}

export function PUT(req: Request) {
  return saveSettings(req);
}
