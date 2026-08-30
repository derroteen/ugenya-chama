"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureMonthRowsForBranch, healBranchCarryForward, isMonthUpToDate } from "@/lib/monthlySheetSync";

export type MonthlyReportTotals = {
  kbgSharesBf: number;
  oldSavingsBf: number;
  previousBalanceBf: number;
  subs: number;
  cumulativeSaving: number;
  previousEmergBf: number;
  emergSubs: number;
  withdrawal: number;
  emergencyBalance: number;
};

export type MonthlyReportRow = {
  memberId: string;
  memberNo: string;
  memberName: string;
  kbgSharesBf: number;
  oldSavingsBf: number;
  previousBalanceBf: number;
  subs: number;
  cumulativeSaving: number;
  previousEmergBf: number;
  emergSubs: number;
  withdrawal: number;
  emergencyBalance: number;
};

export type MonthlyReportBranch = {
  branchId: string;
  branchName: string;
  rows: MonthlyReportRow[];
  totals: MonthlyReportTotals;
  note?: string;
};

export type MonthlyReportData = {
  month: string;
  monthLabel: string;
  generatedAt: string;
  branches: MonthlyReportBranch[];
  grandTotals: MonthlyReportTotals;
};

type MemberRelation = {
  member_id?: string;
  full_name?: string;
  kbg_shares_bf?: number | string | null;
};

type RowAccumulator = MonthlyReportRow;

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeMonth(month: string) {
  const normalized = month.trim();
  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    throw new Error("Month must be in YYYY-MM format.");
  }
  return normalized;
}

function formatMonthLabel(month: string) {
  const date = new Date(`${month}-01T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return month;
  }

  return new Intl.DateTimeFormat("en-KE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

async function ensureAdminAccess() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (profile.role !== "main_admin" && profile.role !== "superadmin")) {
    throw new Error("You do not have permission to manage sheets.");
  }

  return { supabase, userId: user.id };
}

function getMemberRelation(relation: MemberRelation | MemberRelation[] | null | undefined) {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function createEmptyTotals(): MonthlyReportTotals {
  return {
    kbgSharesBf: 0,
    oldSavingsBf: 0,
    previousBalanceBf: 0,
    subs: 0,
    cumulativeSaving: 0,
    previousEmergBf: 0,
    emergSubs: 0,
    withdrawal: 0,
    emergencyBalance: 0,
  };
}

function applyTotals(totals: MonthlyReportTotals, row: MonthlyReportRow) {
  totals.kbgSharesBf += row.kbgSharesBf;
  totals.oldSavingsBf += row.oldSavingsBf;
  totals.previousBalanceBf += row.previousBalanceBf;
  totals.subs += row.subs;
  totals.cumulativeSaving += row.cumulativeSaving;
  totals.previousEmergBf += row.previousEmergBf;
  totals.emergSubs += row.emergSubs;
  totals.withdrawal += row.withdrawal;
  totals.emergencyBalance += row.emergencyBalance;
}

export async function generateMonthlyReport(month: string): Promise<MonthlyReportData> {
  const normalizedMonth = normalizeMonth(month);
  const { supabase, userId } = await ensureAdminAccess();

  const branchesResult = await supabase.from("branches").select("id, name").order("name", { ascending: true });
  if (branchesResult.error) throw branchesResult.error;

  const branches = branchesResult.data ?? [];

  // Backfill this month's row for every active member in every branch first - the same
  // thing that happens when an admin opens a branch's sheet manually - so the report
  // reflects the full membership even for branches nobody has opened yet this month.
  // Skipped for a future month so we never pre-create rows before that month arrives.
  if (isMonthUpToDate(normalizedMonth)) {
    await Promise.all(
      branches.map((branch) => ensureMonthRowsForBranch(supabase, branch.id, normalizedMonth, userId))
    );
  }

  // Heal carry-forward values for every branch unconditionally - this only corrects rows
  // that already exist and never creates new ones, so it is safe to run for any month
  // (past, current, or future) without the isMonthUpToDate guard.
  await Promise.all(branches.map((branch) => healBranchCarryForward(supabase, branch.id)));

  const [monthlyResult, emergencyResult] = await Promise.all([
    supabase
      .from("monthly_savings")
      .select(
        "branch_id, member_id, old_savings_bf, previous_balance_bf, subs, cumulative_saving, members(member_id, full_name, kbg_shares_bf)"
      )
      .eq("month", normalizedMonth),
    supabase
      .from("emergency_contributions")
      .select(
        "branch_id, member_id, previous_emerg_bf, emerg_subs, withdrawal, emergency_balance, members(member_id, full_name, kbg_shares_bf)"
      )
      .eq("month", normalizedMonth),
  ]);

  if (monthlyResult.error) throw monthlyResult.error;
  if (emergencyResult.error) throw emergencyResult.error;

  const rowsByBranch = new Map<string, Map<string, RowAccumulator>>();

  for (const row of monthlyResult.data ?? []) {
    const branchRows = rowsByBranch.get(row.branch_id) ?? new Map<string, RowAccumulator>();
    const member = getMemberRelation(row.members as MemberRelation | MemberRelation[] | null | undefined);

    branchRows.set(row.member_id, {
      memberId: row.member_id,
      memberNo: member?.member_id ?? "-",
      memberName: member?.full_name ?? "Unknown Member",
      kbgSharesBf: toNumber(member?.kbg_shares_bf),
      oldSavingsBf: toNumber(row.old_savings_bf),
      previousBalanceBf: toNumber(row.previous_balance_bf),
      subs: toNumber(row.subs),
      cumulativeSaving: toNumber(row.cumulative_saving),
      previousEmergBf: 0,
      emergSubs: 0,
      withdrawal: 0,
      emergencyBalance: 0,
    });

    rowsByBranch.set(row.branch_id, branchRows);
  }

  for (const row of emergencyResult.data ?? []) {
    const branchRows = rowsByBranch.get(row.branch_id) ?? new Map<string, RowAccumulator>();
    const member = getMemberRelation(row.members as MemberRelation | MemberRelation[] | null | undefined);
    const existing = branchRows.get(row.member_id);

    branchRows.set(row.member_id, {
      memberId: row.member_id,
      memberNo: existing?.memberNo ?? member?.member_id ?? "-",
      memberName: existing?.memberName ?? member?.full_name ?? "Unknown Member",
      kbgSharesBf: existing?.kbgSharesBf ?? toNumber(member?.kbg_shares_bf),
      oldSavingsBf: existing?.oldSavingsBf ?? 0,
      previousBalanceBf: existing?.previousBalanceBf ?? 0,
      subs: existing?.subs ?? 0,
      cumulativeSaving: existing?.cumulativeSaving ?? 0,
      previousEmergBf: toNumber(row.previous_emerg_bf),
      emergSubs: toNumber(row.emerg_subs),
      withdrawal: toNumber(row.withdrawal),
      emergencyBalance: toNumber(row.emergency_balance),
    });

    rowsByBranch.set(row.branch_id, branchRows);
  }

  const grandTotals = createEmptyTotals();
  const reportBranches: MonthlyReportBranch[] = branches.map((branch) => {
    const branchRows = Array.from(rowsByBranch.get(branch.id)?.values() ?? []).sort((left, right) =>
      left.memberName.localeCompare(right.memberName, undefined, { sensitivity: "base" })
    );

    const branchTotals = createEmptyTotals();
    for (const row of branchRows) {
      applyTotals(branchTotals, row);
      applyTotals(grandTotals, row);
    }

    return {
      branchId: branch.id,
      branchName: branch.name,
      rows: branchRows,
      totals: branchTotals,
      note: branchRows.length === 0 ? "No entries recorded for this month." : undefined,
    };
  });

  return {
    month: normalizedMonth,
    monthLabel: formatMonthLabel(normalizedMonth),
    generatedAt: new Date().toISOString(),
    branches: reportBranches,
    grandTotals,
  };
}