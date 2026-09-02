import { cookies } from "next/headers";
import { SESSION_COOKIE, authSecret, verifySessionToken } from "./auth-token";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";

/**
 * Role checks for CMS features. The session cookie carries the signed-in
 * email; the profiles table says what role that account holds. User
 * management demands Super Admin, verified here ON THE SERVER — hiding
 * buttons in the UI is never the security boundary.
 */

export type Role = "Super Admin" | "Content Manager" | "Admission Manager" | "Editor" | "Teacher";
export const ROLES: Role[] = ["Super Admin", "Content Manager", "Admission Manager", "Editor", "Teacher"];

/** Email of the signed-in admin, from the verified session cookie. */
export async function callerEmail(): Promise<string | null> {
  const session = await verifySessionToken(authSecret(), cookies().get(SESSION_COOKIE)?.value);
  return session?.sub ?? null;
}

type AuthUser = { id: string; email?: string; created_at?: string; last_sign_in_at?: string; banned_until?: string };

/** All Supabase Auth accounts (school teams are small; one page suffices). */
export async function listAuthUsers(): Promise<AuthUser[]> {
  const { data, error } = await supabaseAdmin().auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(`Could not list users: ${error.message}`);
  return (data?.users ?? []) as AuthUser[];
}

/** The caller's role, or null when unknown. */
export async function callerRole(): Promise<{ email: string; role: Role | null } | null> {
  const email = await callerEmail();
  if (!email) return null;

  // Local mode has exactly one account — the env admin — who is the boss.
  if (!isSupabaseConfigured()) {
    const envAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    return { email, role: !envAdmin || email.toLowerCase() === envAdmin ? "Super Admin" : null };
  }

  const users = await listAuthUsers();
  const me = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!me) return { email, role: null };

  const { data, error } = await supabaseAdmin().from("profiles").select("role").eq("id", me.id).maybeSingle();
  if (error) throw new Error(`Could not read role: ${error.message}`);
  return { email, role: (data?.role as Role) ?? null };
}

/** Throws unless the caller is a Super Admin; returns the caller's email. */
export async function requireSuperAdmin(): Promise<string> {
  const caller = await callerRole();
  if (!caller) throw new RoleError("Sign in first.", 401);
  if (caller.role !== "Super Admin") {
    throw new RoleError("Only a Super Admin can manage users.", 403);
  }
  return caller.email;
}

/** CMS areas used for permission checks and the role-aware sidebar. */
export type Area =
  | "content"     // news, notices, events, calendar
  | "gallery"
  | "media"
  | "homepage"
  | "admissions"
  | "messages"
  | "settings"
  | "users"
  | "results"
  | "academics"    // classes, examinations, academic years
  | "navigation";  // the public menu

const AREA_ACCESS: Record<Area, Role[]> = {
  content: ["Super Admin", "Content Manager", "Editor"],
  gallery: ["Super Admin", "Content Manager", "Editor"],
  media: ["Super Admin", "Content Manager", "Editor"],
  homepage: ["Super Admin", "Content Manager"],
  admissions: ["Super Admin", "Admission Manager"],
  messages: ["Super Admin", "Admission Manager"],
  settings: ["Super Admin"],
  users: ["Super Admin"],
  results: ["Super Admin", "Teacher"],
  academics: ["Super Admin", "Content Manager"],
  navigation: ["Super Admin", "Content Manager"],
};

export function roleAllows(role: Role | null, area: Area): boolean {
  return !!role && AREA_ACCESS[area].includes(role);
}

/** Every area the role may see — drives the sidebar. */
export function areasFor(role: Role | null): Area[] {
  return (Object.keys(AREA_ACCESS) as Area[]).filter((a) => roleAllows(role, a));
}

/** Throws unless the signed-in caller's role covers the area. */
export async function requireArea(area: Area): Promise<string> {
  const caller = await callerRole();
  if (!caller) throw new RoleError("Sign in first.", 401);
  if (!roleAllows(caller.role, area)) {
    throw new RoleError("Your role doesn't include this section.", 403);
  }
  return caller.email;
}

export class RoleError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}