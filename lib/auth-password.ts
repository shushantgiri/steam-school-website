import { scryptSync, timingSafeEqual } from "crypto";

/**
 * Password verification for the admin login. Node runtime only.
 *
 * Stored format (see `npm run hash-password`):
 *   scrypt:<N>:<r>:<p>:<saltHex>:<hashHex>
 *
 * Colon-separated on purpose — dotenv expands a dollar sign inside .env
 * values, which silently mangles a dollar-separated hash into one that never
 * verifies.
 *
 * Every parameter is read back out of the stored string, so an old hash keeps
 * verifying even if the script's cost parameters change later.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, n, r, p, saltHex, hashHex] = stored.trim().split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const cost = { N: Number(n), r: Number(r), p: Number(p) };
  if (!Number.isInteger(cost.N) || !Number.isInteger(cost.r) || !Number.isInteger(cost.p)) return false;

  try {
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), expected.length, {
      ...cost,
      maxmem: 256 * cost.N * cost.r,
    });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
