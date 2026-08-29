/**
 * Manual verification for the cascadeMonthlySavings / cascadeEmergencyContributions /
 * resyncMonthlySavingsForwardForBranch logic in lib/monthlySheetSync.ts, run against a
 * small in-memory fake Supabase client (no real database touched).
 *
 * Prints before/after numbers for each fabricated row so the carry-forward math can be
 * eyeballed directly, rather than trusting a green build.
 *
 * Usage:
 *   npx tsx scripts/verify-cascade-logic.ts
 */
import {
  cascadeMonthlySavings,
  resyncMonthlySavingsForwardForBranch,
} from "../lib/monthlySheetSync";

type Row = Record<string, unknown>;

class FakeQuery {
  private filters: Array<(row: Row) => boolean> = [];
  private sortKey: string | null = null;
  private sortAsc = true;
  private mode: "select" | "update" = "select";
  private updatePayload: Row | null = null;

  constructor(private table: Row[]) {}

  select(_columns: string) {
    this.mode = "select";
    return this;
  }

  update(payload: Row) {
    this.mode = "update";
    this.updatePayload = payload;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push((row) => (row[column] as string) > (value as string));
    return this;
  }

  order(column: string, opts: { ascending: boolean }) {
    this.sortKey = column;
    this.sortAsc = opts.ascending;
    return this;
  }

  maybeSingle() {
    return this;
  }

  then(onFulfilled: (result: { data: Row[] | null; error: null }) => void) {
    let matched = this.table.filter((row) => this.filters.every((f) => f(row)));

    if (this.mode === "update") {
      matched.forEach((row) => Object.assign(row, this.updatePayload));
      onFulfilled({ data: null, error: null });
      return;
    }

    if (this.sortKey) {
      const key = this.sortKey;
      matched = [...matched].sort((a, b) => {
        if ((a[key] as string) < (b[key] as string)) return this.sortAsc ? -1 : 1;
        if ((a[key] as string) > (b[key] as string)) return this.sortAsc ? 1 : -1;
        return 0;
      });
    }

    onFulfilled({ data: matched, error: null });
  }
}

function createFakeSupabase(tables: Record<string, Row[]>) {
  return {
    from(tableName: string) {
      return new FakeQuery(tables[tableName]);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function snapshot(rows: Row[]) {
  return rows.map((row) => ({ ...row }));
}

function printRows(label: string, rows: Row[], columns: string[]) {
  console.log(`  ${label}`);
  for (const row of rows) {
    const parts = columns.map((col) => `${col}=${row[col]}`).join("  ");
    console.log(`    ${row.month}  ${parts}`);
  }
}

async function scenarioOne() {
  console.log("=== Scenario 1: cascadeMonthlySavings carries old_savings_bf forward ===");

  const monthlySavings: Row[] = [
    { id: "jul", member_id: "m1", month: "2026-07", old_savings_bf: 0, previous_balance_bf: 0, subs: 150, cumulative_saving: 150 },
    { id: "aug", member_id: "m1", month: "2026-08", old_savings_bf: 0, previous_balance_bf: 0, subs: 100, cumulative_saving: 100 },
    { id: "sep", member_id: "m1", month: "2026-09", old_savings_bf: 0, previous_balance_bf: 0, subs: 50, cumulative_saving: 50 },
  ];

  console.log("\nBefore (July/Aug/Sep rows have stale old_savings_bf=0 - the bug):");
  printRows("monthly_savings", snapshot(monthlySavings), ["old_savings_bf", "previous_balance_bf", "subs", "cumulative_saving"]);

  const supabase = createFakeSupabase({ monthly_savings: monthlySavings });

  // Admin just saved June: old_savings_bf=5000, previous_balance_bf=1000, subs=200.
  await cascadeMonthlySavings(supabase, "m1", "2026-06", 5000, 1000, 200);

  console.log("\nAfter cascadeMonthlySavings(member m1, month=2026-06, oldSavingsBf=5000, previousBalanceBf=1000, subs=200):");
  printRows("monthly_savings", monthlySavings, ["old_savings_bf", "previous_balance_bf", "subs", "cumulative_saving"]);

  const expected = [
    { month: "2026-07", old_savings_bf: 5000, previous_balance_bf: 1200, subs: 150, cumulative_saving: 6350 },
    { month: "2026-08", old_savings_bf: 5000, previous_balance_bf: 1350, subs: 100, cumulative_saving: 6450 },
    { month: "2026-09", old_savings_bf: 5000, previous_balance_bf: 1450, subs: 50, cumulative_saving: 6500 },
  ];

  let ok = true;
  for (const exp of expected) {
    const actual = monthlySavings.find((r) => r.month === exp.month)!;
    for (const key of Object.keys(exp) as (keyof typeof exp)[]) {
      if (actual[key] !== exp[key]) {
        ok = false;
        console.log(`  MISMATCH ${exp.month}.${key}: expected ${exp[key]}, got ${actual[key]}`);
      }
    }
  }
  console.log(ok ? "\nScenario 1: PASS - old_savings_bf carried unchanged, previous_balance_bf rolled correctly.\n" : "\nScenario 1: FAIL\n");
  return ok;
}

async function scenarioTwo() {
  console.log("=== Scenario 2: resyncMonthlySavingsForwardForBranch repairs a whole branch ===");

  const monthlySavings: Row[] = [
    { id: "m2-jul", branch_id: "b1", member_id: "m2", month: "2026-07", old_savings_bf: 8000, previous_balance_bf: 500, subs: 300, cumulative_saving: 8800 },
    { id: "m2-aug", branch_id: "b1", member_id: "m2", month: "2026-08", old_savings_bf: 0, previous_balance_bf: 999, subs: 300, cumulative_saving: 1299 },
    { id: "m2-sep", branch_id: "b1", member_id: "m2", month: "2026-09", old_savings_bf: 0, previous_balance_bf: 999, subs: 300, cumulative_saving: 1299 },
  ];

  const emergencyContributions: Row[] = [
    { id: "e2-jul", branch_id: "b1", member_id: "m2", month: "2026-07", previous_emerg_bf: 700, emerg_subs: 300, cumulative_emerg_fund: 1000, withdrawal: 0, emergency_balance: 1000 },
    { id: "e2-aug", branch_id: "b1", member_id: "m2", month: "2026-08", previous_emerg_bf: 0, emerg_subs: 200, cumulative_emerg_fund: 200, withdrawal: 100, emergency_balance: 100 },
    { id: "e2-sep", branch_id: "b1", member_id: "m2", month: "2026-09", previous_emerg_bf: 0, emerg_subs: 200, cumulative_emerg_fund: 200, withdrawal: 0, emergency_balance: 200 },
  ];

  console.log("\nBefore (Aug/Sep rows sitting with stale values - old_savings_bf=0, wrong previous_emerg_bf):");
  printRows("monthly_savings", snapshot(monthlySavings), ["old_savings_bf", "previous_balance_bf", "subs", "cumulative_saving"]);
  printRows("emergency_contributions", snapshot(emergencyContributions), ["previous_emerg_bf", "emerg_subs", "withdrawal", "cumulative_emerg_fund", "emergency_balance"]);

  const julyBefore = { ...monthlySavings.find((r) => r.month === "2026-07")! };

  const supabase = createFakeSupabase({
    monthly_savings: monthlySavings,
    emergency_contributions: emergencyContributions,
  });

  const { membersResynced } = await resyncMonthlySavingsForwardForBranch(supabase, "b1", "2026-07");

  console.log(`\nAfter resyncMonthlySavingsForwardForBranch(branch=b1, fromMonth=2026-07) - ${membersResynced} member(s) resynced:`);
  printRows("monthly_savings", monthlySavings, ["old_savings_bf", "previous_balance_bf", "subs", "cumulative_saving"]);
  printRows("emergency_contributions", emergencyContributions, ["previous_emerg_bf", "emerg_subs", "withdrawal", "cumulative_emerg_fund", "emergency_balance"]);

  const julyAfter = monthlySavings.find((r) => r.month === "2026-07")!;
  const julyUntouched = JSON.stringify(julyBefore) === JSON.stringify(julyAfter);
  console.log(`\nJuly (anchor) row untouched: ${julyUntouched ? "PASS" : "FAIL"}`);

  const expectedMonthly = [
    { month: "2026-08", old_savings_bf: 8000, previous_balance_bf: 800, subs: 300, cumulative_saving: 9100 },
    { month: "2026-09", old_savings_bf: 8000, previous_balance_bf: 1100, subs: 300, cumulative_saving: 9400 },
  ];
  const expectedEmergency = [
    { month: "2026-08", previous_emerg_bf: 1000, cumulative_emerg_fund: 1200, emergency_balance: 1100 },
    { month: "2026-09", previous_emerg_bf: 1200, cumulative_emerg_fund: 1400, emergency_balance: 1400 },
  ];

  let ok = julyUntouched;
  for (const exp of expectedMonthly) {
    const actual = monthlySavings.find((r) => r.month === exp.month)!;
    for (const key of Object.keys(exp) as (keyof typeof exp)[]) {
      if (actual[key] !== exp[key]) {
        ok = false;
        console.log(`  MISMATCH monthly ${exp.month}.${key}: expected ${exp[key]}, got ${actual[key]}`);
      }
    }
  }
  for (const exp of expectedEmergency) {
    const actual = emergencyContributions.find((r) => r.month === exp.month)!;
    for (const key of Object.keys(exp) as (keyof typeof exp)[]) {
      if (actual[key] !== exp[key]) {
        ok = false;
        console.log(`  MISMATCH emergency ${exp.month}.${key}: expected ${exp[key]}, got ${actual[key]}`);
      }
    }
  }

  // Idempotency check: running it again from the same anchor must not change anything.
  const beforeSecondRun = JSON.stringify({ monthlySavings, emergencyContributions });
  await resyncMonthlySavingsForwardForBranch(supabase, "b1", "2026-07");
  const afterSecondRun = JSON.stringify({ monthlySavings, emergencyContributions });
  const idempotent = beforeSecondRun === afterSecondRun;
  console.log(`Idempotent on repeat run: ${idempotent ? "PASS" : "FAIL"}`);
  ok = ok && idempotent;

  console.log(ok ? "\nScenario 2: PASS\n" : "\nScenario 2: FAIL\n");
  return ok;
}

async function main() {
  const results = [await scenarioOne(), await scenarioTwo()];
  const allPassed = results.every(Boolean);
  console.log(allPassed ? "All scenarios PASSED." : "Some scenarios FAILED.");
  process.exit(allPassed ? 0 : 1);
}

main();
