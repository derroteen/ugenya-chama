/**
 * Manual verification for the cascadeMonthlySavings / resyncMonthlySavingsForwardForBranch
 * / healBranchCarryForward logic in lib/monthlySheetSync.ts, run against a small
 * in-memory fake Supabase client (no real database touched).
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
  healBranchCarryForward,
} from "../lib/monthlySheetSync";

type Row = Record<string, unknown>;
type UpdateLogEntry = { table: string; id: unknown };

class FakeQuery {
  private filters: Array<(row: Row) => boolean> = [];
  private sortKeys: Array<{ key: string; ascending: boolean }> = [];
  private mode: "select" | "update" = "select";
  private updatePayload: Row | null = null;

  constructor(
    private tableName: string,
    private table: Row[],
    private updateLog: UpdateLogEntry[]
  ) {}

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
    this.sortKeys.push({ key: column, ascending: opts.ascending });
    return this;
  }

  maybeSingle() {
    return this;
  }

  then(onFulfilled: (result: { data: Row[] | null; error: null }) => void) {
    let matched = this.table.filter((row) => this.filters.every((f) => f(row)));

    if (this.mode === "update") {
      matched.forEach((row) => {
        Object.assign(row, this.updatePayload);
        this.updateLog.push({ table: this.tableName, id: row.id });
      });
      onFulfilled({ data: null, error: null });
      return;
    }

    if (this.sortKeys.length > 0) {
      const sortKeys = this.sortKeys;
      matched = [...matched].sort((a, b) => {
        for (const { key, ascending } of sortKeys) {
          const av = a[key] as string;
          const bv = b[key] as string;
          if (av < bv) return ascending ? -1 : 1;
          if (av > bv) return ascending ? 1 : -1;
        }
        return 0;
      });
    }

    onFulfilled({ data: matched, error: null });
  }
}

function createFakeSupabase(tables: Record<string, Row[]>, updateLog: UpdateLogEntry[] = []) {
  return {
    from(tableName: string) {
      return new FakeQuery(tableName, tables[tableName], updateLog);
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

async function scenarioThree() {
  console.log("=== Scenario 3: healBranchCarryForward - first month, an override, and healing ===");

  const monthlyColumns = ["old_savings_bf", "previous_balance_bf", "subs", "cumulative_saving", "bf_overridden"];
  const emergencyColumns = [
    "previous_emerg_bf",
    "emerg_subs",
    "withdrawal",
    "cumulative_emerg_fund",
    "emergency_balance",
    "bf_overridden",
  ];

  const monthlySavings: Row[] = [
    // First month - deliberately inconsistent cumulative_saving to prove heal never
    // recomputes or writes it, no matter what.
    { id: "m3-jun", branch_id: "b2", member_id: "m3", month: "2026-06", old_savings_bf: 3000, previous_balance_bf: 200, subs: 50, cumulative_saving: 999999, bf_overridden: false },
    // Manually corrected (bf_overridden=true) - these values do NOT match what plain
    // cascading from June would give (that would be old=3000, prev=250, cum=3350).
    { id: "m3-jul", branch_id: "b2", member_id: "m3", month: "2026-07", old_savings_bf: 3500, previous_balance_bf: 100, subs: 100, cumulative_saving: 3700, bf_overridden: true },
    // Stale (pre-heal) values - should be recomputed from July's overridden anchor.
    { id: "m3-aug", branch_id: "b2", member_id: "m3", month: "2026-08", old_savings_bf: 0, previous_balance_bf: 999, subs: 60, cumulative_saving: 1059, bf_overridden: false },
    // Also stale - should chain off August's freshly healed values, not June/July directly.
    { id: "m3-sep", branch_id: "b2", member_id: "m3", month: "2026-09", old_savings_bf: 0, previous_balance_bf: 0, subs: 40, cumulative_saving: 40, bf_overridden: false },
    // Already exactly correct - heal must recompute the same numbers but skip writing.
    { id: "m3-oct", branch_id: "b2", member_id: "m3", month: "2026-10", old_savings_bf: 3500, previous_balance_bf: 300, subs: 10, cumulative_saving: 3810, bf_overridden: false },
  ];

  const emergencyContributions: Row[] = [
    { id: "e3-jun", branch_id: "b2", member_id: "m3", month: "2026-06", previous_emerg_bf: 400, emerg_subs: 50, withdrawal: 0, cumulative_emerg_fund: 999999, emergency_balance: 999999, bf_overridden: false },
    // Manual override - previous_emerg_bf=500 does not descend from June's (wrong) 999999.
    { id: "e3-jul", branch_id: "b2", member_id: "m3", month: "2026-07", previous_emerg_bf: 500, emerg_subs: 50, withdrawal: 0, cumulative_emerg_fund: 550, emergency_balance: 550, bf_overridden: true },
    // Stale - should heal from July's overridden cumulative_emerg_fund (550).
    { id: "e3-aug", branch_id: "b2", member_id: "m3", month: "2026-08", previous_emerg_bf: 0, emerg_subs: 30, withdrawal: 10, cumulative_emerg_fund: 30, emergency_balance: 30, bf_overridden: false },
    // Already exactly correct - must be skipped too.
    { id: "e3-sep", branch_id: "b2", member_id: "m3", month: "2026-09", previous_emerg_bf: 580, emerg_subs: 20, withdrawal: 0, cumulative_emerg_fund: 600, emergency_balance: 600, bf_overridden: false },
  ];

  console.log("\nBefore healBranchCarryForward:");
  printRows("monthly_savings", snapshot(monthlySavings), monthlyColumns);
  printRows("emergency_contributions", snapshot(emergencyContributions), emergencyColumns);

  const juneBefore = { ...monthlySavings.find((r) => r.month === "2026-06")! };
  const julyBefore = { ...monthlySavings.find((r) => r.month === "2026-07")! };
  const octoberBefore = { ...monthlySavings.find((r) => r.month === "2026-10")! };
  const emergJuneBefore = { ...emergencyContributions.find((r) => r.month === "2026-06")! };
  const emergJulyBefore = { ...emergencyContributions.find((r) => r.month === "2026-07")! };
  const emergSepBefore = { ...emergencyContributions.find((r) => r.month === "2026-09")! };

  const updateLog: UpdateLogEntry[] = [];
  const supabase = createFakeSupabase(
    { monthly_savings: monthlySavings, emergency_contributions: emergencyContributions },
    updateLog
  );

  await healBranchCarryForward(supabase, "b2");

  console.log("\nAfter healBranchCarryForward(branch=b2):");
  printRows("monthly_savings", monthlySavings, monthlyColumns);
  printRows("emergency_contributions", emergencyContributions, emergencyColumns);
  console.log(`\nRows actually written: ${JSON.stringify(updateLog)}`);

  let ok = true;

  function expectUnchanged(label: string, before: Row, after: Row) {
    const same = JSON.stringify(before) === JSON.stringify(after);
    console.log(`${label} untouched: ${same ? "PASS" : "FAIL"}`);
    if (!same) ok = false;
  }

  function expectNoWrite(label: string, table: string, id: unknown) {
    const wasWritten = updateLog.some((entry) => entry.table === table && entry.id === id);
    console.log(`${label} skipped (no pointless write): ${!wasWritten ? "PASS" : "FAIL"}`);
    if (wasWritten) ok = false;
  }

  function expectValues(label: string, actual: Row, expected: Row) {
    for (const key of Object.keys(expected)) {
      if (actual[key] !== expected[key]) {
        ok = false;
        console.log(`  MISMATCH ${label}.${key}: expected ${expected[key]}, got ${actual[key]}`);
      }
    }
  }

  // First month is the trusted anchor - read only, never recomputed or written, even
  // though its cumulative_saving is deliberately wrong.
  expectUnchanged("June (first month)", juneBefore, monthlySavings.find((r) => r.month === "2026-06")!);
  expectUnchanged("June emergency (first month)", emergJuneBefore, emergencyContributions.find((r) => r.month === "2026-06")!);

  // bf_overridden=true row is trusted as-is, never recomputed or written.
  expectUnchanged("July (bf_overridden)", julyBefore, monthlySavings.find((r) => r.month === "2026-07")!);
  expectUnchanged("July emergency (bf_overridden)", emergJulyBefore, emergencyContributions.find((r) => r.month === "2026-07")!);

  // August/September must be healed using July's overridden values as the anchor (not
  // whatever June's own - deliberately wrong - numbers were).
  expectValues("August", monthlySavings.find((r) => r.month === "2026-08")!, {
    old_savings_bf: 3500,
    previous_balance_bf: 200,
    cumulative_saving: 3760,
  });
  expectValues("September", monthlySavings.find((r) => r.month === "2026-09")!, {
    old_savings_bf: 3500,
    previous_balance_bf: 260,
    cumulative_saving: 3800,
  });
  expectValues("August emergency", emergencyContributions.find((r) => r.month === "2026-08")!, {
    previous_emerg_bf: 550,
    cumulative_emerg_fund: 580,
    emergency_balance: 570,
  });

  // October/September-emergency were already correct - heal must not issue a write.
  expectValues("October (already correct)", monthlySavings.find((r) => r.month === "2026-10")!, {
    old_savings_bf: 3500,
    previous_balance_bf: 300,
    cumulative_saving: 3810,
  });
  expectNoWrite("October", "monthly_savings", "m3-oct");
  expectUnchanged("October raw row", octoberBefore, monthlySavings.find((r) => r.month === "2026-10")!);

  expectValues("September emergency (already correct)", emergencyContributions.find((r) => r.month === "2026-09")!, {
    previous_emerg_bf: 580,
    cumulative_emerg_fund: 600,
    emergency_balance: 600,
  });
  expectNoWrite("September emergency", "emergency_contributions", "e3-sep");
  expectUnchanged("September emergency raw row", emergSepBefore, emergencyContributions.find((r) => r.month === "2026-09")!);

  console.log(ok ? "\nScenario 3: PASS\n" : "\nScenario 3: FAIL\n");
  return ok;
}

async function main() {
  const results = [await scenarioOne(), await scenarioTwo(), await scenarioThree()];
  const allPassed = results.every(Boolean);
  console.log(allPassed ? "All scenarios PASSED." : "Some scenarios FAILED.");
  process.exit(allPassed ? 0 : 1);
}

main();
