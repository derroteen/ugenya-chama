"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  ensureMonthRowsForBranch,
  healBranchCarryForward,
  resyncMonthlySavingsForwardForBranch,
} from "@/lib/monthlySheetSync";

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
  isFirstMonth: boolean;
  bfOverridden: boolean;
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
  /**
   * true when the caller deliberately unlocked and edited this row's brought-forward
   * figures (see SheetTableClient's "Fix brought-forward figures" flow) - the server
   * only ever sets bf_overridden to true when this is true; it never clears it here.
   */
  bfOverridden?: boolean;
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

  await ensureMonthRowsForBranch(supabase, branchId, normalizedMonth, userId);
  await healBranchCarryForward(supabase, branchId);

  const [{ data: monthlyRows, error: monthlyRowsError }, { data: emergencyRows, error: emergencyRowsError }] =
    await Promise.all([
      supabase
        .from("monthly_savings")
        .select(
          "id, member_id, month, previous_balance_bf, old_savings_bf, subs, cumulative_saving, bf_overridden, members(member_id, full_name, kbg_shares_bf, sheet_order)"
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

  const memberIds = (monthlyRows ?? []).map((row) => row.member_id);
  const membersWithEarlierMonth = new Set<string>();

  if (memberIds.length > 0) {
    const { data: earlierMonthRows, error: earlierMonthRowsError } = await supabase
      .from("monthly_savings")
      .select("member_id")
      .eq("branch_id", branchId)
      .lt("month", normalizedMonth)
      .in("member_id", memberIds);

    if (earlierMonthRowsError) throw earlierMonthRowsError;

    for (const row of earlierMonthRows ?? []) {
      membersWithEarlierMonth.add(row.member_id);
    }
  }

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
      isFirstMonth: !membersWithEarlierMonth.has(row.member_id),
      bfOverridden: Boolean(row.bf_overridden),
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

/**
 * Admin repair tool: re-derives every later month's old_savings_bf/previous_balance_bf/
 * cumulative_saving (and the matching emergency_contributions fields) for this branch,
 * anchored on each member's row at `fromMonth`. See resyncMonthlySavingsForwardForBranch
 * for the walk itself - this wrapper just adds auth, rate limiting, and revalidation.
 */
export async function resyncMonthlySavingsForward(
  branchId: string,
  fromMonth: string
): Promise<UpdateEntryResult> {
  try {
    const requestHeaders = await headers();
    const ip = getClientIpFromHeaders(requestHeaders);
    const rateLimit = checkRateLimit(ip, "resync_monthly_savings_forward", 10);
    if (!rateLimit.allowed) {
      return {
        status: "error",
        message: "Too many resync attempts. Please try again in 15 minutes.",
      };
    }

    const normalizedFromMonth = normalizeMonth(fromMonth);
    const { supabase } = await ensureAdminAccess();

    const { data: branch, error: branchError } = await supabase
      .from("branches")
      .select("id")
      .eq("id", branchId)
      .maybeSingle();

    if (branchError) throw branchError;
    if (!branch) {
      return { status: "error", message: "Branch not found." };
    }

    const { membersResynced } = await resyncMonthlySavingsForwardForBranch(
      supabase,
      branchId,
      normalizedFromMonth
    );

    revalidateSheetPath(branchId);

    return {
      status: "success",
      message:
        membersResynced === 0
          ? `No rows found for ${normalizedFromMonth} in this branch - nothing to resync.`
          : `Resynced ${membersResynced} member${membersResynced === 1 ? "" : "s"} forward from ${normalizedFromMonth}.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error && error.message ? error.message : "Unable to resync forward.",
    };
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
      bfOverridden: boolean;
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

      // Guard against the exact "carried the whole figures to the next sheet the way they
      // are" mistake (Kipkaren, August 2026): this only runs when the caller deliberately
      // unlocked and is saving brought-forward figures (bfOverridden === true), since that
      // unlock is the only path that can freeze a row's Old Savings B/F / Previous Balance
      // B/F / Subs forever (bf_overridden = true stops the automatic carry-forward healer
      // from ever touching it again). If the prior month actually had a contribution
      // (subs !== 0) and the figures being saved are identical to that prior month's, this
      // is almost certainly last month's numbers copied forward instead of rolled forward -
      // block the save and explain the expected values, rather than silently locking in a
      // duplicate.
      if (row.bfOverridden === true) {
        const [priorMonthlyResult, priorEmergencyResult] = await Promise.all([
          supabase
            .from("monthly_savings")
            .select("old_savings_bf, previous_balance_bf, subs")
            .eq("member_id", monthlyRow.member_id)
            .lt("month", monthlyRow.month)
            .order("month", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("emergency_contributions")
            .select("previous_emerg_bf, emerg_subs")
            .eq("member_id", monthlyRow.member_id)
            .lt("month", monthlyRow.month)
            .order("month", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (priorMonthlyResult.error) throw priorMonthlyResult.error;
        if (priorEmergencyResult.error) throw priorEmergencyResult.error;

        const priorMonthly = priorMonthlyResult.data;
        if (priorMonthly) {
          const priorSubs = toNumber(priorMonthly.subs);
          const priorPreviousBalanceBf = toNumber(priorMonthly.previous_balance_bf);
          const priorOldSavingsBf = toNumber(priorMonthly.old_savings_bf);

          const looksCopiedFromPriorMonth =
            priorSubs !== 0 &&
            oldSavingsBf === priorOldSavingsBf &&
            previousBalanceBf === priorPreviousBalanceBf &&
            subs === priorSubs;

          if (looksCopiedFromPriorMonth) {
            const expectedPreviousBalanceBf = priorPreviousBalanceBf + priorSubs;
            return {
              status: "error",
              message: `Row ${rowNumber} (${memberLabel}): Old Savings B/F, Previous Balance B/F and Subs are all identical to last month's, including a non-zero Subs of ${priorSubs} - this looks like last month's figures were copied instead of carried forward. Previous Balance B/F should normally be ${expectedPreviousBalanceBf} (last month's Previous Balance B/F + last month's Subs), with Subs reset to 0 for this new month's entries. If these figures are genuinely correct, change at least one value slightly to confirm it's intentional before saving.`,
            };
          }
        }

        const priorEmergency = priorEmergencyResult.data;
        if (priorEmergency) {
          const priorEmergSubs = toNumber(priorEmergency.emerg_subs);
          const priorPreviousEmergBf = toNumber(priorEmergency.previous_emerg_bf);

          const looksCopiedFromPriorMonth =
            priorEmergSubs !== 0 &&
            previousEmergBf === priorPreviousEmergBf &&
            emergSubs === priorEmergSubs;

          if (looksCopiedFromPriorMonth) {
            const expectedPreviousEmergBf = priorPreviousEmergBf + priorEmergSubs;
            return {
              status: "error",
              message: `Row ${rowNumber} (${memberLabel}): Previous Emerg B/F and Emerg Subs are identical to last month's, including a non-zero Emerg Subs of ${priorEmergSubs} - this looks like last month's figures were copied instead of carried forward. Previous Emerg B/F should normally be ${expectedPreviousEmergBf} (last month's Previous Emerg B/F + last month's Emerg Subs), with Emerg Subs reset to 0 for this new month's entries. If these figures are genuinely correct, change at least one value slightly to confirm it's intentional before saving.`,
            };
          }
        }
      }

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
        bfOverridden: row.bfOverridden === true,
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

      const monthlyUpdatePayload: Record<string, number | boolean> = {
        old_savings_bf: update.oldSavingsBf,
        previous_balance_bf: update.previousBalanceBf,
        subs: update.subs,
        cumulative_saving: update.cumulativeSaving,
      };
      if (update.bfOverridden) {
        monthlyUpdatePayload.bf_overridden = true;
      }

      const { error: monthlyUpdateError } = await supabase
        .from("monthly_savings")
        .update(monthlyUpdatePayload)
        .eq("id", update.monthlySavingsId);

      if (monthlyUpdateError) {
        return {
          status: "error",
          message: `Row ${update.rowNumber} (${update.memberLabel}) could not be saved.`,
        };
      }

      const emergencyUpdatePayload: Record<string, number | boolean> = {
        previous_emerg_bf: update.previousEmergBf,
        emerg_subs: update.emergSubs,
        cumulative_emerg_fund: update.cumulativeEmergFund,
        withdrawal: update.withdrawal,
        emergency_balance: update.emergencyBalance,
      };
      if (update.bfOverridden) {
        emergencyUpdatePayload.bf_overridden = true;
      }

      const { error: emergencyUpdateError } = await supabase
        .from("emergency_contributions")
        .update(emergencyUpdatePayload)
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