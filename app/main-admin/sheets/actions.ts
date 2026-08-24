"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

function revalidateSheetPath(branchId: string) {
  revalidatePath(`/main-admin/sheets/${branchId}`);
}

function getClientIpFromHeaders(headerStore: Headers) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headerStore.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

export type SheetRow = {
  monthlySavingsId: string;
  emergencyContributionId: string;
  memberId: string;
  memberNo: string;
  memberName: string;
  sheetOrder: number | null;
  kbgSharesBf: number;
  oldSavingsBf: number;
  previousBalanceBf: number;
  subs: number;
  cumulativeSaving: number;
  previousEmergBf: number;
  emergSubs: number;
  cumulativeEmergFund: number;
  withdrawal: number;
  emergencyBalance: number;
};

export type UpdateEntryResult = {
  status: "success" | "error";
  message: string;
};

export type UpdateAllEntriesInput = {
  monthlySavingsId: string;
  emergencyContributionId: string;
  kbgSharesBf: string | number;
  oldSavingsBf: string | number;
  previousBalanceBf: string | number;
  subs: string | number;
  previousEmergBf: string | number;
  emergSubs: string | number;
  withdrawal: string | number;
};

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

function parseMoney(value: string) {
  const normalized = value.trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Amounts must be non-negative numbers.");
  }
  return parsed;
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

export async function openMonthForBranch(branchId: string, month: string): Promise<SheetRow[]> {
  const normalizedMonth = normalizeMonth(month);
  const { supabase, userId } = await ensureAdminAccess();

  const { data: existingMonthly, error: existingMonthlyError } = await supabase
    .from("monthly_savings")
    .select("id, member_id, month, previous_balance_bf, old_savings_bf, subs, cumulative_saving")
    .eq("branch_id", branchId)
    .eq("month", normalizedMonth)
    .order("member_id", { ascending: true });

  if (existingMonthlyError) {
    throw existingMonthlyError;
  }

  const { data: activeMembers, error: membersError } = await supabase
    .from("members")
    .select("id, member_id, full_name, kbg_shares_bf, sheet_order")
    .eq("branch_id", branchId)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (membersError) {
    throw membersError;
  }

  const members = activeMembers ?? [];
  const existingMemberIds = new Set((existingMonthly ?? []).map((row) => row.member_id));
  const missingMembers = members.filter((member) => !existingMemberIds.has(member.id));
  const missingMemberIds = missingMembers.map((member) => member.id);

  if (missingMembers.length > 0) {
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
      if (row.month >= normalizedMonth) {
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
        month: normalizedMonth,
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
        month: normalizedMonth,
        previous_emerg_bf: previousEmergencyBalance,
        emerg_subs: 0,
        cumulative_emerg_fund: previousEmergencyBalance,
        withdrawal: 0,
        emergency_balance: previousEmergencyBalance,
        created_by: userId,
      };
    });

    if (monthlyPayload.length > 0) {
      const { error: monthlyInsertError } = await supabase
        .from("monthly_savings")
        .upsert(monthlyPayload, { onConflict: "branch_id,member_id,month", ignoreDuplicates: true });
      if (monthlyInsertError) throw monthlyInsertError;
    }

    if (emergencyPayload.length > 0) {
      const { error: emergencyInsertError } = await supabase
        .from("emergency_contributions")
        .upsert(emergencyPayload, { onConflict: "branch_id,member_id,month", ignoreDuplicates: true });
      if (emergencyInsertError) throw emergencyInsertError;
    }
  }

  const [{ data: monthlyRows, error: monthlyRowsError }, { data: emergencyRows, error: emergencyRowsError }] =
    await Promise.all([
      supabase
        .from("monthly_savings")
        .select(
          "id, member_id, month, previous_balance_bf, old_savings_bf, subs, cumulative_saving, members(member_id, full_name, kbg_shares_bf, sheet_order)"
        )
        .eq("branch_id", branchId)
        .eq("month", normalizedMonth)
        .order("full_name", { ascending: true, foreignTable: "members" }),
      supabase
        .from("emergency_contributions")
        .select("id, member_id, month, previous_emerg_bf, emerg_subs, cumulative_emerg_fund, withdrawal, emergency_balance")
        .eq("branch_id", branchId)
        .eq("month", normalizedMonth)
        .order("created_at", { ascending: true }),
    ]);

  if (monthlyRowsError) throw monthlyRowsError;
  if (emergencyRowsError) throw emergencyRowsError;

  const emergencyByMember = new Map<string, (typeof emergencyRows)[number]>();
  for (const row of emergencyRows ?? []) {
    emergencyByMember.set(row.member_id, row);
  }

  const rows = (monthlyRows ?? []).map((row) => {
    const emergency = emergencyByMember.get(row.member_id);
    const memberRelation = row.members as {
      member_id?: string;
      full_name?: string;
      kbg_shares_bf?: number | string | null;
      sheet_order?: number | null;
    }
      | Array<{
          member_id?: string;
          full_name?: string;
          kbg_shares_bf?: number | string | null;
          sheet_order?: number | null;
        }>
      | null;

    const member = Array.isArray(memberRelation) ? memberRelation[0] : memberRelation;

    return {
      monthlySavingsId: row.id,
      emergencyContributionId: emergency?.id ?? "",
      memberId: row.member_id,
      memberNo: member?.member_id ?? "-",
      memberName: member?.full_name ?? "Unknown Member",
      sheetOrder: member?.sheet_order ?? null,
      kbgSharesBf: toNumber(member?.kbg_shares_bf),
      oldSavingsBf: toNumber(row.old_savings_bf),
      previousBalanceBf: toNumber(row.previous_balance_bf),
      subs: toNumber(row.subs),
      cumulativeSaving: toNumber(row.cumulative_saving),
      previousEmergBf: toNumber(emergency?.previous_emerg_bf),
      emergSubs: toNumber(emergency?.emerg_subs),
      cumulativeEmergFund: toNumber(emergency?.cumulative_emerg_fund),
      withdrawal: toNumber(emergency?.withdrawal),
      emergencyBalance: toNumber(emergency?.emergency_balance),
    };
  });

  return rows.sort((a, b) => {
    if (a.sheetOrder == null && b.sheetOrder == null) return 0;
    if (a.sheetOrder == null) return 1; // nulls go last
    if (b.sheetOrder == null) return -1;
    return a.sheetOrder - b.sheetOrder;
  });
}

export async function updateMonthlyEntry(
  monthlySavingsId: string,
  emergencyContributionId: string,
  kbgSharesBfInput: string,
  oldSavingsBfInput: string,
  previousBalanceBfInput: string,
  subsInput: string,
  previousEmergBfInput: string,
  emergSubsInput: string,
  withdrawalInput: string
): Promise<UpdateEntryResult> {
  try {
    const requestHeaders = await headers();
    const ip = getClientIpFromHeaders(requestHeaders);
    const rateLimit = checkRateLimit(ip, "update_monthly_entry", 60);
    if (!rateLimit.allowed) {
      return {
        status: "error",
        message: "Too many row save attempts. Please try again in 15 minutes.",
      };
    }

    const { supabase } = await ensureAdminAccess();

    const kbgSharesBf = parseMoney(kbgSharesBfInput);
    const oldSavingsBf = parseMoney(oldSavingsBfInput);
    const previousBalanceBf = parseMoney(previousBalanceBfInput);
    const subs = parseMoney(subsInput);
    const previousEmergBf = parseMoney(previousEmergBfInput);
    const emergSubs = parseMoney(emergSubsInput);
    const withdrawal = parseMoney(withdrawalInput);

    const { data: monthlyRow, error: monthlyRowError } = await supabase
      .from("monthly_savings")
      .select("id, branch_id, month, member_id")
      .eq("id", monthlySavingsId)
      .single();

    if (monthlyRowError || !monthlyRow) {
      throw monthlyRowError ?? new Error("Monthly row not found.");
    }

    const { data: emergencyRow, error: emergencyRowError } = await supabase
      .from("emergency_contributions")
      .select("id")
      .eq("id", emergencyContributionId)
      .single();

    if (emergencyRowError || !emergencyRow) {
      throw emergencyRowError ?? new Error("Emergency row not found.");
    }

    const cumulativeSaving = oldSavingsBf + previousBalanceBf + subs;
    const cumulativeEmergFund = previousEmergBf + emergSubs;
    const emergencyBalance = cumulativeEmergFund - withdrawal;

    if (emergencyBalance < 0) {
      return {
        status: "error",
        message: "Withdrawal cannot exceed the cumulative emergency fund.",
      };
    }

    const { error: memberUpdateError } = await supabase
      .from("members")
      .update({
        kbg_shares_bf: kbgSharesBf,
      })
      .eq("id", monthlyRow.member_id);

    if (memberUpdateError) throw memberUpdateError;

    const { error: monthlyUpdateError } = await supabase
      .from("monthly_savings")
      .update({
        old_savings_bf: oldSavingsBf,
        previous_balance_bf: previousBalanceBf,
        subs,
        cumulative_saving: cumulativeSaving,
      })
      .eq("id", monthlySavingsId);

    if (monthlyUpdateError) throw monthlyUpdateError;

    const { error: emergencyUpdateError } = await supabase
      .from("emergency_contributions")
      .update({
        previous_emerg_bf: previousEmergBf,
        emerg_subs: emergSubs,
        cumulative_emerg_fund: cumulativeEmergFund,
        withdrawal,
        emergency_balance: emergencyBalance,
      })
      .eq("id", emergencyContributionId);

    if (emergencyUpdateError) throw emergencyUpdateError;

    revalidateSheetPath(monthlyRow.branch_id);

    return {
      status: "success",
      message: "Row saved successfully.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error && error.message ? error.message : "Unable to save row.",
    };
  }
}

export async function updateMonthlyEntryFromForm(formData: FormData): Promise<void> {
  const monthlySavingsId = String(formData.get("monthlySavingsId") ?? "").trim();
  const emergencyContributionId = String(formData.get("emergencyContributionId") ?? "").trim();
  const kbgSharesBf = String(formData.get("kbgSharesBf") ?? "");
  const oldSavingsBf = String(formData.get("oldSavingsBf") ?? "");
  const previousBalanceBf = String(formData.get("previousBalanceBf") ?? "");
  const subs = String(formData.get("subs") ?? "");
  const previousEmergBf = String(formData.get("previousEmergBf") ?? "");
  const emergSubs = String(formData.get("emergSubs") ?? "");
  const withdrawal = String(formData.get("withdrawal") ?? "");

  const result = await updateMonthlyEntry(
    monthlySavingsId,
    emergencyContributionId,
    kbgSharesBf,
    oldSavingsBf,
    previousBalanceBf,
    subs,
    previousEmergBf,
    emergSubs,
    withdrawal
  );

  if (result.status === "error") {
    throw new Error(result.message);
  }
}

export async function updateAllEntries(rows: UpdateAllEntriesInput[]): Promise<UpdateEntryResult> {
  try {
    const requestHeaders = await headers();
    const ip = getClientIpFromHeaders(requestHeaders);
    const rateLimit = checkRateLimit(ip, "update_all_entries", 30);
    if (!rateLimit.allowed) {
      return {
        status: "error",
        message: "Too many bulk save attempts. Please try again in 15 minutes.",
      };
    }

    const { supabase } = await ensureAdminAccess();

    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        status: "success",
        message: "0 rows saved.",
      };
    }

    const preparedUpdates: Array<{
      rowNumber: number;
      memberLabel: string;
      memberId: string;
      monthlySavingsId: string;
      emergencyContributionId: string;
      branchId: string;
      month: string;
      kbgSharesBf: number;
      oldSavingsBf: number;
      previousBalanceBf: number;
      subs: number;
      cumulativeSaving: number;
      previousEmergBf: number;
      emergSubs: number;
      cumulativeEmergFund: number;
      withdrawal: number;
      emergencyBalance: number;
    }> = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 1;

      let kbgSharesBf: number;
      let oldSavingsBf: number;
      let previousBalanceBf: number;
      let subs: number;
      let previousEmergBf: number;
      let emergSubs: number;
      let withdrawal: number;

      try {
        kbgSharesBf = parseMoney(String(row.kbgSharesBf ?? ""));
      } catch {
        return {
          status: "error",
          message: `Row ${rowNumber}: KBG Shares B/F must be a non-negative number.`,
        };
      }

      try {
        oldSavingsBf = parseMoney(String(row.oldSavingsBf ?? ""));
      } catch {
        return {
          status: "error",
          message: `Row ${rowNumber}: Old Savings B/F must be a non-negative number.`,
        };
      }

      try {
        previousBalanceBf = parseMoney(String(row.previousBalanceBf ?? ""));
      } catch {
        return {
          status: "error",
          message: `Row ${rowNumber}: Previous Balance B/F must be a non-negative number.`,
        };
      }

      try {
        subs = parseMoney(String(row.subs ?? ""));
      } catch {
        return {
          status: "error",
          message: `Row ${rowNumber}: Subs must be a non-negative number.`,
        };
      }

      try {
        previousEmergBf = parseMoney(String(row.previousEmergBf ?? ""));
      } catch {
        return {
          status: "error",
          message: `Row ${rowNumber}: Previous Emerg B/F must be a non-negative number.`,
        };
      }

      try {
        emergSubs = parseMoney(String(row.emergSubs ?? ""));
      } catch {
        return {
          status: "error",
          message: `Row ${rowNumber}: Emerg Subs must be a non-negative number.`,
        };
      }

      try {
        withdrawal = parseMoney(String(row.withdrawal ?? ""));
      } catch {
        return {
          status: "error",
          message: `Row ${rowNumber}: Withdrawal must be a non-negative number.`,
        };
      }

      const { data: monthlyRow, error: monthlyRowError } = await supabase
        .from("monthly_savings")
        .select("id, branch_id, month, member_id, members(member_id, full_name)")
        .eq("id", row.monthlySavingsId)
        .single();

      if (monthlyRowError || !monthlyRow) {
        return {
          status: "error",
          message: `Row ${rowNumber}: monthly row not found.`,
        };
      }

      const { data: emergencyRow, error: emergencyRowError } = await supabase
        .from("emergency_contributions")
        .select("id")
        .eq("id", row.emergencyContributionId)
        .single();

      if (emergencyRowError || !emergencyRow) {
        return {
          status: "error",
          message: `Row ${rowNumber}: emergency row not found.`,
        };
      }

      const memberRelation = monthlyRow.members as
        | { member_id?: string; full_name?: string }
        | Array<{ member_id?: string; full_name?: string }>
        | null;
      const member = Array.isArray(memberRelation) ? memberRelation[0] : memberRelation;
      const memberLabel = member?.full_name ?? member?.member_id ?? "Unknown Member";

      const cumulativeSaving = oldSavingsBf + previousBalanceBf + subs;
      const cumulativeEmergFund = previousEmergBf + emergSubs;
      const emergencyBalance = cumulativeEmergFund - withdrawal;

      if (emergencyBalance < 0) {
        return {
          status: "error",
          message: `Row ${rowNumber} (${memberLabel}) withdrawal cannot exceed the cumulative emergency fund.`,
        };
      }

      preparedUpdates.push({
        rowNumber,
        memberLabel,
        memberId: monthlyRow.member_id,
        monthlySavingsId: row.monthlySavingsId,
        emergencyContributionId: row.emergencyContributionId,
        branchId: monthlyRow.branch_id,
        month: monthlyRow.month,
        kbgSharesBf,
        oldSavingsBf,
        previousBalanceBf,
        subs,
        cumulativeSaving,
        previousEmergBf,
        emergSubs,
        cumulativeEmergFund,
        withdrawal,
        emergencyBalance,
      });
    }

    for (const update of preparedUpdates) {
      const { error: memberUpdateError } = await supabase
        .from("members")
        .update({
          kbg_shares_bf: update.kbgSharesBf,
        })
        .eq("id", update.memberId);

      if (memberUpdateError) {
        return {
          status: "error",
          message: `Row ${update.rowNumber} (${update.memberLabel}) could not be saved.`,
        };
      }

      const { error: monthlyUpdateError } = await supabase
        .from("monthly_savings")
        .update({
          old_savings_bf: update.oldSavingsBf,
          previous_balance_bf: update.previousBalanceBf,
          subs: update.subs,
          cumulative_saving: update.cumulativeSaving,
        })
        .eq("id", update.monthlySavingsId);

      if (monthlyUpdateError) {
        return {
          status: "error",
          message: `Row ${update.rowNumber} (${update.memberLabel}) could not be saved.`,
        };
      }

      const { error: emergencyUpdateError } = await supabase
        .from("emergency_contributions")
        .update({
          previous_emerg_bf: update.previousEmergBf,
          emerg_subs: update.emergSubs,
          cumulative_emerg_fund: update.cumulativeEmergFund,
          withdrawal: update.withdrawal,
          emergency_balance: update.emergencyBalance,
        })
        .eq("id", update.emergencyContributionId);

      if (emergencyUpdateError) {
        return {
          status: "error",
          message: `Row ${update.rowNumber} (${update.memberLabel}) could not be saved.`,
        };
      }
    }

    const revalidationBranchIds = new Set(preparedUpdates.map((update) => update.branchId));
    for (const branchId of revalidationBranchIds) {
      revalidateSheetPath(branchId);
    }

    return {
      status: "success",
      message: `${preparedUpdates.length} rows saved.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error && error.message ? error.message : "Unable to save all rows.",
    };
  }
}
