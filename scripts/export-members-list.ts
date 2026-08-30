/**
 * One-off export script - NOT wired into the app, NOT run automatically.
 *
 * Dumps every member's full name, generated member ID, and branch name to
 * scripts/output/members-list.json, read-only (no writes to the database).
 *
 * Usage:
 *   npx tsx scripts/export-members-list.ts
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: members, error } = await supabase
    .from("members")
    .select("member_id, full_name, branch_id, branches(name)")
    .order("full_name", { ascending: true });

  if (error) throw error;

  const rows = (members ?? []).map((m: any) => ({
    memberId: m.member_id,
    fullName: m.full_name,
    branchName: m.branches?.name ?? "Unassigned",
  }));

  const outDir = path.join(process.cwd(), "scripts", "output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "members-list.json");
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), "utf8");

  console.log(`Wrote ${rows.length} member(s) to ${outPath}`);
}

main().catch((error) => {
  console.error("Export failed:", error);
  process.exit(1);
});
