#!/usr/bin/env node
/**
 * Turns a password into the value for ADMIN_PASSWORD_HASH.
 *
 *   npm run hash-password -- "your new password"
 *
 * Run with no argument to get a generated password as well as its hash.
 * The plain password is never stored — only the line printed for .env.local.
 */
import { randomBytes, scryptSync } from "node:crypto";

const N = 16384, r = 8, p = 1, KEYLEN = 64;

const hash = (password) => {
  const salt = randomBytes(16);
  const key = scryptSync(password.normalize("NFKC"), salt, KEYLEN, { N, r, p, maxmem: 256 * N * r });
  // Colon-separated: dotenv would expand a dollar sign in the .env value.
  return ["scrypt", N, r, p, salt.toString("hex"), key.toString("hex")].join(":");
};

const given = process.argv.slice(2).join(" ").trim();
const password = given || randomBytes(12).toString("base64url");

console.log("");
if (!given) console.log(`Generated password : ${password}\n(store it in your password manager — it is not saved anywhere)\n`);
console.log("Add these to .env.local:\n");
console.log(`ADMIN_PASSWORD_HASH="${hash(password)}"`);
console.log(`AUTH_SECRET="${randomBytes(32).toString("hex")}"`);
console.log("\nRestart (and rebuild, for production) after changing these.\n");
