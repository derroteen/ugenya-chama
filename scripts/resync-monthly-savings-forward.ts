/**
 * One-off repair script - NOT wired into the app, NOT run automatically.
 *
 * Walks every branch's monthly_savings / emergency_contributions rows forward from
 * FROM_MONTH, using resyncMonthlySavingsForwardForBranch (lib/monthlySheetSync.ts) -
 * the same cascade logic used by the "Resync This Branch Forward" button. This repairs
 * old_savings_bf / previous_balance_bf values left stale by the pre-fix cascade bug
 * (old_savings_bf was never carried into later months).
 *
 * For each branch, only members with a monthly_savings row at exactly FROM_MONTH are
 * resynced (that row is the anchor and is never modified itself). A member whose first
 * row is after FROM_MONTH is skipped - there is no anchor to resync them from.
 *
 * This writes directly to production data via the Supabase service-role key (bypasses
 * RLS). Review it carefully before running.
 *
 * Usage:
 *   npx tsx scripts/resync-monthly-savings-forward.ts
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { resyncMonthlySavingsForwardForBranch } from "../lib/monthlySheetSync";

const FROM_MONTH = "2026-07";

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

  const { data: branches, error: branchesError } = await supabase
    .from("branches")
    .select("id, name")
    .order("name", { ascending: true });

  if (branchesError) throw branchesError;

  console.log(`Resyncing ${branches?.length ?? 0} branches forward from ${FROM_MONTH}...\n`);

  for (const branch of branches ?? []) {
    const { membersResynced } = await resyncMonthlySavingsForwardForBranch(
      supabase,
      branch.id,
      FROM_MONTH
    );
    console.log(`${branch.name}: ${membersResynced} member(s) resynced.`);
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Resync failed:", error);
  process.exit(1);
});
