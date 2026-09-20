/**
 * READ-ONLY diagnostic - makes no writes of any kind.
 *
 * Pulls all 2026 monthly_savings and emergency_contributions rows in two queries total,
 * then aggregates per month locally. Reports row counts, how many rows have subs > 0,
 * how many are flagged bf_overridden, and summed old_savings_bf / previous_balance_bf /
 * subs per month - to check whether Jan-Jun already have placeholder (backfilled) rows,
 * and whether July's brought-forward figures still look intact.
 *
 * Usage:
 *   npx tsx scripts/diagnose-2026-savings.ts
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

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function main() {
  console.log("Starting... loading .env.local");
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Connected. Fetching monthly_savings for 2026 (one query)...");

  const { data: savingsRows, error: savingsError } = await supabase
    .from("monthly_savings")
    .select("month, old_savings_bf, previous_balance_bf, subs, bf_overridden")
    .gte("month", "2026-01")
    .lte("month", "2026-12");

  if (savingsError) throw savingsError;

  console.log(`Got ${savingsRows?.length ?? 0} monthly_savings rows. Fetching emergency_contributions...`);

  const { data: emergencyRows, error: emergencyError } = await supabase
    .from("emergency_contributions")
    .select("month, previous_emerg_bf, emerg_subs, withdrawal")
    .gte("month", "2026-01")
    .lte("month", "2026-12");

  if (emergencyError) throw emergencyError;

  console.log(`Got ${emergencyRows?.length ?? 0} emergency_contributions rows.\n`);

  console.log("Month      | Rows | Rows w/ subs>0 | Overridden | Sum old_savings_bf | Sum previous_balance_bf | Sum subs");
  console.log("-".repeat(120));

  for (let m = 1; m <= 12; m += 1) {
    const month = `2026-${String(m).padStart(2, "0")}`;
    const rows = (savingsRows ?? []).filter((r) => r.month === month);

    const rowsWithSubs = rows.filter((r) => toNumber(r.subs) > 0).length;
    const overridden = rows.filter((r) => r.bf_overridden).length;
    const sumOld = rows.reduce((s, r) => s + toNumber(r.old_savings_bf), 0);
    const sumPrev = rows.reduce((s, r) => s + toNumber(r.previous_balance_bf), 0);
    const sumSubs = rows.reduce((s, r) => s + toNumber(r.subs), 0);

    console.log(
      `${month}   | ${String(rows.length).padStart(4)} | ${String(rowsWithSubs).padStart(14)} | ${String(overridden).padStart(10)} | ${sumOld.toFixed(2).padStart(18)} | ${sumPrev.toFixed(2).padStart(23)} | ${sumSubs.toFixed(2)}`
    );
  }

  console.log("\nSame breakdown for emergency_contributions:\n");
  console.log("Month      | Rows | Sum previous_emerg_bf | Sum emerg_subs | Sum withdrawal");
  console.log("-".repeat(90));

  for (let m = 1; m <= 12; m += 1) {
    const month = `2026-${String(m).padStart(2, "0")}`;
    const rows = (emergencyRows ?? []).filter((r) => r.month === month);

    const sumPrevEmerg = rows.reduce((s, r) => s + toNumber(r.previous_emerg_bf), 0);
    const sumEmergSubs = rows.reduce((s, r) => s + toNumber(r.emerg_subs), 0);
    const sumWithdrawal = rows.reduce((s, r) => s + toNumber(r.withdrawal), 0);

    console.log(
      `${month}   | ${String(rows.length).padStart(4)} | ${sumPrevEmerg.toFixed(2).padStart(21)} | ${sumEmergSubs.toFixed(2).padStart(14)} | ${sumWithdrawal.toFixed(2)}`
    );
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Diagnostic failed:", error);
  process.exit(1);
});
