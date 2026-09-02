import { requireArea, RoleError } from "@/lib/roles";
import { deleteFromCollection, getFromCollection, updateInCollection } from "@/lib/collection-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export function GET(_req: Request, { params }: Params) {
  return getFromCollection("events", params.id);
}

export function PATCH(req: Request, { params }: Params) {
  return updateInCollection("events", params.id, req);
}

export function DELETE(_req: Request, { params }: Params) {
  return deleteFromCollection("events", params.id);
}
