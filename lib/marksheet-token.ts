/**
 * Marksheet access token. A family who successfully looks up a result (exact
 * name + BS date of birth + class) receives a signed token bound to that one
 * result id. The marksheet page and PDF endpoint accept either an admin
 * session or a valid token — so marksheets are never enumerable by id alone.
 *
 * Web Crypto only (same primitives as the session cookie), so it works in
 * every runtime.
 */
import { authSecret } from "./auth-token";

const encoder = new TextEncoder();

const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

/** Token for a result id; null when the app has no signing secret. */
export async function marksheetToken(resultId: string): Promise<string | null> {
  const secret = authSecret();
  if (!secret) return null;
  return (await hmac(secret, `marksheet:${resultId}`)).slice(0, 40);
}

/** Constant-time-ish comparison of a presented token. */
export async function verifyMarksheetToken(resultId: string, token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await marksheetToken(resultId);
  if (!expected || expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}
