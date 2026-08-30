"use server";

import { createClient } from "@/lib/supabase/server";

export type SavingsPassbookRow = {
  month: string;
  kbgSharesBf: number;
  oldSavingsBf: number;
  previousBalanceBf: number;
  subs: number;
  cumulativeSaving: number;
};

export type EmergencyPassbookRow = {
  month: string;
  previousEmergBf: number;
  emergSubs: number;
  withdrawal: number;
  emergencyBalance: number;
};

export type PassbookData = {
  memberName: string;
  memberId: string;
  branchName: string;
  kbgSharesBf: number;
  fromMonth: string;
  toMonth: string;
  savingsRows: SavingsPassbookRow[];
  emergencyRows: EmergencyPassbookRow[];
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeMonth(value?: string | null) {
  const cleaned = value?.trim() ?? "";
  if (!cleaned) return "";
  if (!/^\d{4}-\d{2}$/.test(cleaned)) {
    throw new Error("Month must use the format YYYY-MM.");
  }
  return cleaned;
}

function normalizeMonthRange(fromMonth?: string | null, toMonth?: string | null) {
  const normalizedFrom = normalizeMonth(fromMonth);
  const normalizedTo = normalizeMonth(toMonth);

  if (normalizedFrom && normalizedTo && normalizedFrom > normalizedTo) {
    throw new Error("From month must be earlier than or equal to the To month.");
  }

  return { fromMonth: normalizedFrom, toMonth: normalizedTo };
}

async function getAuthenticatedMemberProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Your member profile could not be loaded.");
  }

  if (profile.role !== "member") {
    throw new Error("Only member accounts can view a personal passbook.");
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, member_id, full_name, branch_id, kbg_shares_bf")
    .eq("auth_id", user.id)
    .single();

  if (memberError || !member) {
    throw new Error("Your member record could not be found.");
  }

  const { data: branch, error: branchError } = member.branch_id
    ? await supabase.from("branches").select("name").eq("id", member.branch_id).single()
    : { data: null, error: null };

  if (branchError && member.branch_id) {
    throw new Error("Your branch details could not be loaded.");
  }

  return {
    supabase,
    member,
    branchName: branch?.name ?? "Unknown Branch",
  };
}

export async function getMemberPassbookData(fromMonth?: string | null, toMonth?: string | null): Promise<PassbookData> {
  const { supabase, member, branchName } = await getAuthenticatedMemberProfile();
  const range = normalizeMonthRange(fromMonth, toMonth);

  const [monthlyResult, emergencyResult] = await Promise.all([
    supabase
      .from("monthly_savings")
      .select("month, old_savings_bf, previous_balance_bf, subs, cumulative_saving")
      .eq("member_id", member.id)
      .order("month", { ascending: true }),
    supabase
      .from("emergency_contributions")
      .select("month, previous_emerg_bf, emerg_subs, withdrawal, emergency_balance")
      .eq("member_id", member.id)
      .order("month", { ascending: true }),
  ]);

  if (monthlyResult.error) {
    throw monthlyResult.error;
  }

  if (emergencyResult.error) {
    throw emergencyResult.error;
  }

  const filterRowsByRange = <T extends { month: string }>(rows: T[]) => {
    return rows.filter((row) => {
      const withinFrom = range.fromMonth ? row.month >= range.fromMonth : true;
      const withinTo = range.toMonth ? row.month <= range.toMonth : true;
      return withinFrom && withinTo;
    });
  };

  // KBG Shares B/F is a one-time, static-per-member figure stored on members.kbg_shares_bf
  // (not per month), so the same value is shown alongside every row here - mirroring how
  // the admin's monthly sheet joins it in from the members table for each row too.
  const kbgSharesBf = toNumber(member.kbg_shares_bf);

  const savingsRows: SavingsPassbookRow[] = filterRowsByRange(monthlyResult.data ?? []).map((row) => ({
    month: row.month,
    kbgSharesBf,
    oldSavingsBf: toNumber(row.old_savings_bf),
    previousBalanceBf: toNumber(row.previous_balance_bf),
    subs: toNumber(row.subs),
    cumulativeSaving: toNumber(row.cumulative_saving),
  }));

  const emergencyRows: EmergencyPassbookRow[] = filterRowsByRange(emergencyResult.data ?? []).map((row) => ({
    month: row.month,
    previousEmergBf: toNumber(row.previous_emerg_bf),
    emergSubs: toNumber(row.emerg_subs),
    withdrawal: toNumber(row.withdrawal),
    emergencyBalance: toNumber(row.emergency_balance),
  }));

  return {
    memberName: member.full_name,
    memberId: member.member_id,
    branchName,
    kbgSharesBf,
    fromMonth: range.fromMonth,
    toMonth: range.toMonth,
    savingsRows,
    emergencyRows,
  };
}
