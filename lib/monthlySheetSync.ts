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
 * Deliberate-override-reset tool used only by resyncMonthlySavingsForwardForBranch:
 * propagates the given anchor values forward into every later monthly_savings row for
 * this member, and clears bf_overridden on every row it touches (this is what makes
 * running the resync tool a deliberate "trust this anchor, recompute everything after
 * it" action that supersedes prior manual corrections). old_savings_bf is a
 * within-year-constant figure (last year's closing balance) - it is carried forward
 * unchanged, never recalculated, matching `anchor`'s value. previous_balance_bf rolls
 * forward as (prior previous_balance_bf + prior subs); each row's own subs is left as-is.
 * Never touches `month` itself, only rows strictly after it.
 *
 * Day-to-day forward propagation (routine saves) is handled by healBranchCarryForward
 * instead, which respects bf_overridden rather than blowing through it.
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
        bf_overridden: false,
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
 * forward as the prior row's resulting cumulative_emerg_fund. Also clears
 * bf_overridden on every row it touches, for the same reason as cascadeMonthlySavings.
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
        bf_overridden: false,
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
 * overwriting whatever stale values are sitting there now and clearing bf_overridden on
 * every row touched (see cascadeMonthlySavings). `fromMonth`'s own row - including its
 * own bf_overridden flag - is only ever read, never written. Idempotent: re-running it
 * with the same fromMonth always re-derives the same later-month values from the same
 * anchor.
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

/**
 * Self-healing pass over a branch's entire carry-forward history, run on every sheet
 * page view (called from openMonthForBranch, right after ensureMonthRowsForBranch) so
 * stale figures never need to be noticed and manually resynced.
 *
 * For each member, walks their monthly_savings rows in month order:
 *  - The first row is always the trusted starting point - read only, never recomputed,
 *    never written.
 *  - A row with bf_overridden=true is trusted as-is (not recomputed) and becomes the new
 *    anchor for every row after it - this is what stops healing from reverting a
 *    deliberate manual correction.
 *  - Any other row has its old_savings_bf/previous_balance_bf/cumulative_saving
 *    recomputed from the current anchor (old_savings_bf carried unchanged;
 *    previous_balance_bf = anchor's previous_balance_bf + anchor's subs). Only writes
 *    when at least one value actually differs from what's stored, since this runs on
 *    every page view. Its resulting values become the anchor for the next row.
 *
 * Does the equivalent walk for emergency_contributions (previous_emerg_bf/
 * cumulative_emerg_fund/emergency_balance), independently.
 */
export async function healBranchCarryForward(
  supabase: Awaited<ReturnType<typeof createClient>>,
  branchId: string
): Promise<void> {
  const { data: monthlyRows, error: monthlyRowsError } = await supabase
    .from("monthly_savings")
    .select("id, member_id, month, old_savings_bf, previous_balance_bf, subs, cumulative_saving, bf_overridden")
    .eq("branch_id", branchId)
    .order("member_id", { ascending: true })
    .order("month", { ascending: true });

  if (monthlyRowsError) throw monthlyRowsError;

  const monthlyByMember = new Map<string, NonNullable<typeof monthlyRows>>();
  for (const row of monthlyRows ?? []) {
    const list = monthlyByMember.get(row.member_id) ?? [];
    list.push(row);
    monthlyByMember.set(row.member_id, list);
  }

  for (const memberRows of monthlyByMember.values()) {
    memberRows.sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));

    let anchorOldSavingsBf = toNumber(memberRows[0].old_savings_bf);
    let anchorPreviousBalanceBf = toNumber(memberRows[0].previous_balance_bf);
    let anchorSubs = toNumber(memberRows[0].subs);

    for (let i = 1; i < memberRows.length; i += 1) {
      const row = memberRows[i];

      if (row.bf_overridden) {
        anchorOldSavingsBf = toNumber(row.old_savings_bf);
        anchorPreviousBalanceBf = toNumber(row.previous_balance_bf);
        anchorSubs = toNumber(row.subs);
        continue;
      }

      const expectedOldSavingsBf = anchorOldSavingsBf;
      const expectedPreviousBalanceBf = anchorPreviousBalanceBf + anchorSubs;
      const subs = toNumber(row.subs);
      const expectedCumulativeSaving = expectedOldSavingsBf + expectedPreviousBalanceBf + subs;

      if (
        toNumber(row.old_savings_bf) !== expectedOldSavingsBf ||
        toNumber(row.previous_balance_bf) !== expectedPreviousBalanceBf ||
        toNumber(row.cumulative_saving) !== expectedCumulativeSaving
      ) {
        const { error: updateError } = await supabase
          .from("monthly_savings")
          .update({
            old_savings_bf: expectedOldSavingsBf,
            previous_balance_bf: expectedPreviousBalanceBf,
            cumulative_saving: expectedCumulativeSaving,
          })
          .eq("id", row.id);

        if (updateError) throw updateError;
      }

      anchorOldSavingsBf = expectedOldSavingsBf;
      anchorPreviousBalanceBf = expectedPreviousBalanceBf;
      anchorSubs = subs;
    }
  }

  const { data: emergencyRows, error: emergencyRowsError } = await supabase
    .from("emergency_contributions")
    .select(
      "id, member_id, month, previous_emerg_bf, emerg_subs, withdrawal, cumulative_emerg_fund, emergency_balance, bf_overridden"
    )
    .eq("branch_id", branchId)
    .order("member_id", { ascending: true })
    .order("month", { ascending: true });

  if (emergencyRowsError) throw emergencyRowsError;

  const emergencyByMember = new Map<string, NonNullable<typeof emergencyRows>>();
  for (const row of emergencyRows ?? []) {
    const list = emergencyByMember.get(row.member_id) ?? [];
    list.push(row);
    emergencyByMember.set(row.member_id, list);
  }

  for (const memberRows of emergencyByMember.values()) {
    memberRows.sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));

    let anchorCumulativeEmergFund = toNumber(memberRows[0].cumulative_emerg_fund);

    for (let i = 1; i < memberRows.length; i += 1) {
      const row = memberRows[i];

      if (row.bf_overridden) {
        anchorCumulativeEmergFund = toNumber(row.cumulative_emerg_fund);
        continue;
      }

      const expectedPreviousEmergBf = anchorCumulativeEmergFund;
      const emergSubs = toNumber(row.emerg_subs);
      const withdrawal = toNumber(row.withdrawal);
      const expectedCumulativeEmergFund = expectedPreviousEmergBf + emergSubs;
      const expectedEmergencyBalance = expectedCumulativeEmergFund - withdrawal;

      if (
        toNumber(row.previous_emerg_bf) !== expectedPreviousEmergBf ||
        toNumber(row.cumulative_emerg_fund) !== expectedCumulativeEmergFund ||
        toNumber(row.emergency_balance) !== expectedEmergencyBalance
      ) {
        const { error: updateError } = await supabase
          .from("emergency_contributions")
          .update({
            previous_emerg_bf: expectedPreviousEmergBf,
            cumulative_emerg_fund: expectedCumulativeEmergFund,
            emergency_balance: expectedEmergencyBalance,
          })
          .eq("id", row.id);

        if (updateError) throw updateError;
      }

      anchorCumulativeEmergFund = expectedCumulativeEmergFund;
    }
  }
}
