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
