import type { createClient } from "@/lib/supabase/server";

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * True when `month` (YYYY-MM) is the current month or earlier. Used to stop reports from
 * accidentally "opening" - and creating real monthly_savings/emergency_contributions rows
 * for - a month that hasn't happened yet (e.g. an annual report run in August looping
 * through December).
 */
export function isMonthUpToDate(month: string): boolean {
  return month <= new Date().toISOString().slice(0, 7);
}

/**
 * Creates this branch's monthly_savings / emergency_contributions row, for `month`, for
 * every active member who doesn't already have one - carrying forward balances from their
 * most recent prior month, using the same math as the manual "open sheet" flow
 * (app/main-admin/sheets/[branchId]). Safe to call repeatedly: members who already have a
 * row for the month are left untouched (upsert with ignoreDuplicates).
 *
 * This is what makes reports "auto update": previously a branch's members only got a row
 * for a month once an admin opened that branch's sheet page for that month, so any report
 * generated before that (across all 12 branches) silently skipped everyone without a row.
 */
export async function ensureMonthRowsForBranch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  branchId: string,
  month: string,
  userId: string
): Promise<void> {
  const { data: existingMonthly, error: existingMonthlyError } = await supabase
    .from("monthly_savings")
    .select("member_id")
    .eq("branch_id", branchId)
    .eq("month", month);

  if (existingMonthlyError) {
    throw existingMonthlyError;
  }

  const { data: activeMembers, error: membersError } = await supabase
    .from("members")
    .select("id")
    .eq("branch_id", branchId)
    .eq("status", "active");

  if (membersError) {
    throw membersError;
  }

  const members = activeMembers ?? [];
  const existingMemberIds = new Set((existingMonthly ?? []).map((row) => row.member_id));
  const missingMembers = members.filter((member) => !existingMemberIds.has(member.id));
  const missingMemberIds = missingMembers.map((member) => member.id);

  if (missingMemberIds.length === 0) {
    return;
  }

  const [latestMonthlyResult, latestEmergencyResult] = await Promise.all([
    supabase
      .from("monthly_savings")
      .select("member_id, previous_balance_bf, subs, old_savings_bf, month")
      .in("member_id", missingMemberIds)
      .order("month", { ascending: false }),
    supabase
      .from("emergency_contributions")
      .select("member_id, emergency_balance, month")
      .in("member_id", missingMemberIds)
      .order("month", { ascending: false }),
  ]);

  if (latestMonthlyResult.error) throw latestMonthlyResult.error;
  if (latestEmergencyResult.error) throw latestEmergencyResult.error;

  const latestMonthlyByMember = new Map<
    string,
    { previousBalanceBf: number; subs: number; oldSavingsBf: number }
  >();
  for (const row of latestMonthlyResult.data ?? []) {
    if (row.month >= month) {
      continue;
    }

    if (!latestMonthlyByMember.has(row.member_id)) {
      latestMonthlyByMember.set(row.member_id, {
        previousBalanceBf: toNumber(row.previous_balance_bf),
        subs: toNumber(row.subs),
        oldSavingsBf: toNumber(row.old_savings_bf),
      });
    }
  }

  const latestEmergencyByMember = new Map<string, number>();
  for (const row of latestEmergencyResult.data ?? []) {
    if (!latestEmergencyByMember.has(row.member_id)) {
      latestEmergencyByMember.set(row.member_id, toNumber(row.emergency_balance));
    }
  }

  const monthlyPayload = missingMembers.map((member) => {
    const latestMonthly = latestMonthlyByMember.get(member.id);
    const previousBalance = latestMonthly
      ? latestMonthly.previousBalanceBf + latestMonthly.subs
      : 0;
    const oldSavingsBf = latestMonthly?.oldSavingsBf ?? 0;
    return {
      branch_id: branchId,
      member_id: member.id,
      month,
      old_savings_bf: oldSavingsBf,
      previous_balance_bf: previousBalance,
      subs: 0,
      cumulative_saving: previousBalance,
      created_by: userId,
    };
  });

  const emergencyPayload = missingMembers.map((member) => {
    const previousEmergencyBalance = latestEmergencyByMember.get(member.id) ?? 0;
    return {
      branch_id: branchId,
      member_id: member.id,
      month,
      previous_emerg_bf: previousEmergencyBalance,
      emerg_subs: 0,
      cumulative_emerg_fund: previousEmergencyBalance,
      withdrawal: 0,
      emergency_balance: previousEmergencyBalance,
      created_by: userId,
    };
  });

  const [monthlyInsert, emergencyInsert] = await Promise.all([
    supabase
      .from("monthly_savings")
      .upsert(monthlyPayload, { onConflict: "branch_id,member_id,month", ignoreDuplicates: true }),
    supabase
      .from("emergency_contributions")
      .upsert(emergencyPayload, { onConflict: "branch_id,member_id,month", ignoreDuplicates: true }),
  ]);

  if (monthlyInsert.error) throw monthlyInsert.error;
  if (emergencyInsert.error) throw emergencyInsert.error;
}

/**
 * Propagates one member's saved values forward into every later monthly_savings row
 * (branch/month opened ahead of time via ensureMonthRowsForBranch, or a correction made
 * to an earlier month after later months already exist). old_savings_bf is a
 * within-year-constant figure (last year's closing balance) - it is carried forward
 * unchanged, never recalculated, matching `anchor`'s value. previous_balance_bf rolls
 * forward as (prior previous_balance_bf + prior subs); each row's own subs is left as-is.
 * Never touches `month` itself, only rows strictly after it.
 */
export async function cascadeMonthlySavings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberId: string,
  month: string,
  oldSavingsBf: number,
  previousBalanceBf: number,
  subs: number
): Promise<void> {
  const { data: laterRows, error } = await supabase
    .from("monthly_savings")
    .select("id, subs, month")
    .eq("member_id", memberId)
    .gt("month", month)
    .order("month", { ascending: true });

  if (error) throw error;

  let priorPreviousBalanceBf = previousBalanceBf;
  let priorSubs = subs;
  for (const row of laterRows ?? []) {
    const nextPreviousBalanceBf = priorPreviousBalanceBf + priorSubs;
    const nextSubs = toNumber(row.subs);
    const cumulativeSaving = oldSavingsBf + nextPreviousBalanceBf + nextSubs;

    const { error: updateError } = await supabase
      .from("monthly_savings")
      .update({
        old_savings_bf: oldSavingsBf,
        previous_balance_bf: nextPreviousBalanceBf,
        cumulative_saving: cumulativeSaving,
      })
      .eq("id", row.id);

    if (updateError) throw updateError;
    priorPreviousBalanceBf = nextPreviousBalanceBf;
    priorSubs = nextSubs;
  }
}

/**
 * Same idea as cascadeMonthlySavings but for emergency_contributions - there is no
 * static field here (no old-savings-style value), so previous_emerg_bf simply rolls
 * forward as the prior row's resulting cumulative_emerg_fund.
 */
export async function cascadeEmergencyContributions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberId: string,
  month: string,
  cumulativeEmergFund: number
): Promise<void> {
  const { data: laterRows, error } = await supabase
    .from("emergency_contributions")
    .select("id, emerg_subs, withdrawal, month")
    .eq("member_id", memberId)
    .gt("month", month)
    .order("month", { ascending: true });

  if (error) throw error;

  let priorCumulativeEmergFund = cumulativeEmergFund;
  for (const row of laterRows ?? []) {
    const emergSubs = toNumber(row.emerg_subs);
    const withdrawal = toNumber(row.withdrawal);
    const nextCumulativeEmergFund = priorCumulativeEmergFund + emergSubs;
    const emergencyBalance = nextCumulativeEmergFund - withdrawal;

    const { error: updateError } = await supabase
      .from("emergency_contributions")
      .update({
        previous_emerg_bf: priorCumulativeEmergFund,
        cumulative_emerg_fund: nextCumulativeEmergFund,
        emergency_balance: emergencyBalance,
      })
      .eq("id", row.id);

    if (updateError) throw updateError;
    priorCumulativeEmergFund = nextCumulativeEmergFund;
  }
}

/**
 * Repairs a branch's carry-forward chain by re-walking it forward from `fromMonth`.
 * For every member who has a monthly_savings row at exactly `fromMonth`, that row's
 * current old_savings_bf/previous_balance_bf/subs are used as the anchor and cascaded
 * into every later month via cascadeMonthlySavings/cascadeEmergencyContributions -
 * overwriting whatever stale values are sitting there now. `fromMonth`'s own row is
 * only ever read, never written. Idempotent: re-running it with the same fromMonth
 * always re-derives the same later-month values from the same anchor.
 *
 * A member with no row at exactly `fromMonth` (e.g. they joined later) is skipped -
 * there is no anchor to resync from for them.
 */
export async function resyncMonthlySavingsForwardForBranch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  branchId: string,
  fromMonth: string
): Promise<{ membersResynced: number }> {
  const { data: anchorRows, error: anchorRowsError } = await supabase
    .from("monthly_savings")
    .select("member_id, old_savings_bf, previous_balance_bf, subs")
    .eq("branch_id", branchId)
    .eq("month", fromMonth);

  if (anchorRowsError) throw anchorRowsError;

  const { data: anchorEmergencyRows, error: anchorEmergencyRowsError } = await supabase
    .from("emergency_contributions")
    .select("member_id, cumulative_emerg_fund")
    .eq("branch_id", branchId)
    .eq("month", fromMonth);

  if (anchorEmergencyRowsError) throw anchorEmergencyRowsError;

  const anchorEmergencyByMember = new Map<string, number>(
    (anchorEmergencyRows ?? []).map((row) => [row.member_id, toNumber(row.cumulative_emerg_fund)])
  );

  for (const anchor of anchorRows ?? []) {
    await cascadeMonthlySavings(
      supabase,
      anchor.member_id,
      fromMonth,
      toNumber(anchor.old_savings_bf),
      toNumber(anchor.previous_balance_bf),
      toNumber(anchor.subs)
    );

    const cumulativeEmergFund = anchorEmergencyByMember.get(anchor.member_id);
    if (cumulativeEmergFund !== undefined) {
      await cascadeEmergencyContributions(supabase, anchor.member_id, fromMonth, cumulativeEmergFund);
    }
  }

  return { membersResynced: (anchorRows ?? []).length };
}
