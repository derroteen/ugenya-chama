"use server";

import { createClient } from "@/lib/supabase/server";

export type BlankSheetRow = {
  memberId: string;
  memberNo: string;
  memberName: string;
  sheetOrder: number | null;
  kbgSharesBf: number;
  oldSavingsBf: number;
  previousBalanceBf: number;
  previousEmergBf: number;
};

export type BlankCollectionSheetData = {
  branchId: string;
  branchName: string;
  generatedAt: string;
  rows: BlankSheetRow[];
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

// Blank sheet downloads are admin-only (main_admin / superadmin). Members no longer
// have a way to reach this - the member-facing download button and its dedicated
// entry point (generateMemberOwnBranchBlankSheet) were removed by design.
async function ensureSheetAccess() {
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
    throw new Error("You do not have permission to access sheets.");
  }

  return { supabase, profile };
}

export async function generateBlankCollectionSheet(branchId: string): Promise<BlankCollectionSheetData> {
  const { supabase } = await ensureSheetAccess();

  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .select("id, name")
    .eq("id", branchId)
    .single();

  if (branchError || !branch) {
    throw branchError ?? new Error("Branch not found.");
  }

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("id, member_id, full_name, kbg_shares_bf, sheet_order")
    .eq("branch_id", branchId)
    .eq("status", "active")
    .order("sheet_order", { ascending: true, nullsFirst: false })
    .order("full_name", { ascending: true });

  if (membersError) throw membersError;

  const memberList = members ?? [];
  const memberIds = memberList.map((member) => member.id);

  const oldSavingsByMember = new Map<string, number>();
  const previousBalanceByMember = new Map<string, number>();
  const previousEmergByMember = new Map<string, number>();

  if (memberIds.length > 0) {
    const [latestMonthlyResult, latestEmergencyResult] = await Promise.all([
      supabase
        .from("monthly_savings")
        .select("member_id, old_savings_bf, previous_balance_bf, month")
        .in("member_id", memberIds)
        .order("month", { ascending: false }),
      supabase
        .from("emergency_contributions")
        .select("member_id, previous_emerg_bf, month")
        .in("member_id", memberIds)
        .order("month", { ascending: false }),
    ]);

    if (latestMonthlyResult.error) throw latestMonthlyResult.error;
    if (latestEmergencyResult.error) throw latestEmergencyResult.error;

    for (const row of latestMonthlyResult.data ?? []) {
      if (!oldSavingsByMember.has(row.member_id)) {
        oldSavingsByMember.set(row.member_id, toNumber(row.old_savings_bf));
      }

      if (!previousBalanceByMember.has(row.member_id)) {
        previousBalanceByMember.set(row.member_id, toNumber(row.previous_balance_bf));
      }
    }

    for (const row of latestEmergencyResult.data ?? []) {
      if (!previousEmergByMember.has(row.member_id)) {
        previousEmergByMember.set(row.member_id, toNumber(row.previous_emerg_bf));
      }
    }
  }

  const rows: BlankSheetRow[] = memberList.map((member) => ({
    memberId: member.id,
    memberNo: member.member_id,
    memberName: member.full_name,
    sheetOrder: member.sheet_order,
    kbgSharesBf: toNumber(member.kbg_shares_bf),
    oldSavingsBf: oldSavingsByMember.get(member.id) ?? 0,
    previousBalanceBf: previousBalanceByMember.get(member.id) ?? 0,
    previousEmergBf: previousEmergByMember.get(member.id) ?? 0,
  }));

  return {
    branchId: branch.id,
    branchName: branch.name,
    generatedAt: new Date().toISOString(),
    rows,
  };
}
