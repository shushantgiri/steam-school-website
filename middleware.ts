import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, authSecret, verifySessionToken } from "@/lib/auth-token";

/**
 * Guards the CMS:
 *   • /admin/*                    — signed out visitors are sent to the login page
 *   • /api/* writes               — need a valid session cookie…
 *   • …except PUBLIC_WRITES       — the website's own forms (admissions, contact)
 *   • /api/* reads                — open (public pages render from them)…
 *   • …except PRIVATE_READS       — personal data (applications, messages, activity)
 *
 * Fails closed. With no ADMIN_PASSWORD_HASH (or AUTH_SECRET) configured there
 * is no valid session, so nothing behind this gate can be reached or changed.
 */

const WRITE_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/** Visitor-facing form submissions — exact path + method POST only. */
const PUBLIC_WRITES = new Set(["/api/applications", "/api/messages", "/api/upload", "/api/results/search"]);

/** Reads that expose personal data — admin session required even for GET. */
const PRIVATE_READS = ["/api/applications", "/api/messages", "/api/activity", "/api/users", "/api/media", "/api/results"];

/**
 * Maintenance Mode. The flag is read from the app's own public settings
 * endpoint and cached briefly (the edge runtime cannot read the database
 * directly). Visitors are rewritten to /maintenance before any public page
 * renders, so no site content is ever sent; signed-in staff pass through.
 */
let maintenanceCache: { enabled: boolean; at: number } = { enabled: false, at: 0 };
async function maintenanceEnabled(origin: string): Promise<boolean> {
  if (Date.now() - maintenanceCache.at < 10_000) return maintenanceCache.enabled;
  try {
    const res = await fetch(`${origin}/api/settings/public`, { cache: "no-store" });
    const body = res.ok ? await res.json() : null;
    maintenanceCache = { enabled: !!body?.maintenance?.enabled, at: Date.now() };
  } catch {
    maintenanceCache = { enabled: false, at: Date.now() };
  }
  return maintenanceCache.enabled;
}

const isPublicPage = (pathname: string) =>
  !pathname.startsWith("/admin") && !pathname.startsWith("/api") && !pathname.startsWith("/_next") &&
  pathname !== "/maintenance" && !/\.[a-z0-9]+$/i.test(pathname);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Uploaded website files (photos, the logo, notice PDFs) are public assets —
  // exactly like the public Supabase Storage bucket in production mode. They
  // also bypass the maintenance gate so the maintenance page's own logo loads.
  if (pathname.startsWith("/uploads/")) {
    return NextResponse.next();
  }

  if (isPublicPage(pathname)) {
    if (await maintenanceEnabled(req.nextUrl.origin)) {
      const session = await verifySessionToken(authSecret(), req.cookies.get(SESSION_COOKIE)?.value);
      if (!session) {
        const res = NextResponse.rewrite(new URL("/maintenance", req.url));
        res.headers.set("Cache-Control", "no-store");
        return res;
      }
    }
    return NextResponse.next();
  }

  // Signing in and out has to work while signed out.
  if (pathname.startsWith("/api/auth/")) {
    const res = NextResponse.next();
    // Explicitly forbid ALL caching of API data and admin pages — some
    // networks run proxies that cache GETs; this plus per-request URL
    // busting (lib/client-api.ts) makes stale reads impossible.
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    return res;
  }

  const session = await verifySessionToken(authSecret(), req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/")) {
    if (session) {
    const res = NextResponse.next();
    // Explicitly forbid ALL caching of API data and admin pages — some
    // networks run proxies that cache GETs; this plus per-request URL
    // busting (lib/client-api.ts) makes stale reads impossible.
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    return res;
  }
    if (req.method === "POST" && PUBLIC_WRITES.has(pathname)) {
    const res = NextResponse.next();
    // Explicitly forbid ALL caching of API data and admin pages — some
    // networks run proxies that cache GETs; this plus per-request URL
    // busting (lib/client-api.ts) makes stale reads impossible.
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    return res;
  }
    if (WRITE_METHODS.has(req.method)) {
      return NextResponse.json({ error: "Sign in to make changes." }, { status: 401 });
    }
    if (PRIVATE_READS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.json({ error: "Sign in to view this." }, { status: 401 });
    }
    {
    const res = NextResponse.next();
    // Explicitly forbid ALL caching of API data and admin pages — some
    // networks run proxies that cache GETs; this plus per-request URL
    // busting (lib/client-api.ts) makes stale reads impossible.
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    return res;
  }
  }

  if (pathname === "/admin/login") {
    return session ? NextResponse.redirect(new URL("/admin", req.url)) : NextResponse.next();
  }
  if (session) {
    const res = NextResponse.next();
    // Explicitly forbid ALL caching of API data and admin pages — some
    // networks run proxies that cache GETs; this plus per-request URL
    // busting (lib/client-api.ts) makes stale reads impossible.
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    return res;
  }

  const login = new URL("/admin/login", req.url);
  if (pathname !== "/admin") login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};