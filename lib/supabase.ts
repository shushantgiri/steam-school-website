import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Next.js patches global fetch and CACHES GET requests in its Data Cache —
 * including the requests supabase-js makes to PostgREST. On Vercel that
 * cache is shared and persistent, so reads can return stale rows AFTER a
 * successful write (admin saves, then a reload shows old content). Every
 * Supabase request must therefore opt out with cache: "no-store".
 */
const freshFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

/**
 * Server-side Supabase access. The service-role client bypasses RLS and must
 * NEVER be imported from client components — route handlers and server
 * components only. Configuration is entirely env-driven:
 *
 *   NEXT_PUBLIC_SUPABASE_URL       project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  public (anon) key — safe for the browser
 *   SUPABASE_SERVICE_ROLE_KEY      secret — server only
 *
 * With none of these set, the app runs in local JSON mode (see lib/store.ts).
 */

export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabaseAuthConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

let admin: SupabaseClient | null = null;

/** Service-role client (server only). Throws if called while unconfigured. */
export function supabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }
  if (!admin) {
    admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: freshFetch },
    });
  }
  return admin;
}

/** Anon-key client for auth calls (sign-in, password reset). Server-side use. */
export function supabaseAnon(): SupabaseClient {
  if (!supabaseAuthConfigured()) {
    throw new Error("Supabase auth is not configured (NEXT_PUBLIC_SUPABASE_ANON_KEY missing).");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: freshFetch },
  });
}
