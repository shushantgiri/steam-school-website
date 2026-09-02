#!/usr/bin/env node
/**
 * One-time migration of the local /data JSON seeds into Supabase.
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 *   npm run seed:supabase
 *
 * Idempotent: re-running overwrites the cms_documents rows with the local
 * files. It never touches applications, messages, or activity.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Minimal .env.local loader (no extra dependency).
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const docs = ["news", "notices", "events", "settings", "gallery", "homepage", "testimonials", "staff", "about", "academics", "navigation"];

for (const doc of docs) {
  const data = JSON.parse(readFileSync(`data/${doc}.json`, "utf8"));
  const { error } = await supabase
    .from("cms_documents")
    .upsert({ key: doc, data, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    console.error(`✗ ${doc}: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ ${doc} seeded`);
}
console.log("Done. The website now reads and writes these documents in Supabase.");
