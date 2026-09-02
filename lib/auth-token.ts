/**
 * Session cookie: a signed, expiring token. Uses Web Crypto only, so the same
 * code verifies the cookie in middleware (Edge runtime) and in route handlers.
 * Never import anything Node-specific here.
 */

export const SESSION_COOKIE = "steam_admin_session";

export type Session = { sub: string; exp: number };

/**
 * Signing key. `AUTH_SECRET` if set; otherwise the password hash, which has the
 * useful side effect of invalidating every session when the password changes.
 */
export function authSecret(): string | null {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD_HASH || null;
}

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (value: string) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

const keyFor = (secret: string) =>
  crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

export async function createSessionToken(secret: string, sub: string, maxAgeSeconds: number) {
  const payload: Session = { sub, exp: Math.floor(Date.now() / 1000) + maxAgeSeconds };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await keyFor(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Returns the session only if the signature checks out and it hasn't expired. */
export async function verifySessionToken(secret: string | null, token: string | undefined): Promise<Session | null> {
  if (!secret || !token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await keyFor(secret),
      fromBase64Url(signature),
      encoder.encode(body)
    );
    if (!valid) return null;

    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as Session;
    if (typeof session?.exp !== "number" || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

/** Cookie options shared by the login and logout routes. */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}
