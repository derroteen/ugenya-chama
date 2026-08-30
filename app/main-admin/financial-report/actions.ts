"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureMonthRowsForBranch, healBranchCarryForward, isMonthUpToDate } from "@/lib/monthlySheetSync";

export type VentureFinancialSummary = {
  ventureId: string;
  ventureName: string;
  totalIncome: number;
  fuel: number;
  driverPayment: number;
  maintenance: number;
  otherExpense: number;
  totalExpenses: number;
  netProfit: number;
};

export type FinancialReportData = {
  month: string;
  monthLabel: string;
  generatedAt: string;
  savingsSummary: {
    totalSubs: number;
    totalEmergencyContributions: number;
    totalWithdrawals: number;
    netPosition: number;
  };
  businessSummaries: VentureFinancialSummary[];
  businessTotals: {
    totalIncome: number;
    fuel: number;
    driverPayment: number;
    maintenance: number;
    otherExpense: number;
    totalExpenses: number;
    netProfit: number;
  };
  overallPosition: {
    totalInflow: number;
    totalOutflow: number;
    netAssociationPosition: number;
  };
};

export type AnnualReportRow = {
  month: string;
  monthLabel: string;
  totalSubs: number;
  totalEmergencyContributions: number;
  totalWithdrawals: number;
  businessIncome: number;
  businessExpenses: number;
  netPosition: number;
  // True only for the single collapsed row standing in for a stretch of months this
  // year that have no monthly_savings/emergency_contributions records at all (e.g. the
  // association only started digitizing sheets partway through 2026). Never created by
  // backfilling - see generateAnnualReport for why that would be unsafe.
  isBroughtForward?: boolean;
};

export type AnnualReportTotal = {
  month: "TOTAL";
  monthLabel: "Year Total";
  totalSubs: number;
  totalEmergencyContributions: number;
  totalWithdrawals: number;
  businessIncome: number;
  businessExpenses: number;
  netPosition: number;
};

// Decomposes the association's savings position into where it came from: the fixed
// legacy figure carried in from before this tracking system existed ("2025 Totals",
// sourced from old_savings_bf - a static per-member value, not a per-month one), versus
// everything accumulated during/into the requested year (including any stretch of
// months with no records, represented by previous_balance_bf as recorded on the first
// month that does have records).
export type SavingsPositionSummary = {
  priorYearsTotal: number;
  currentYearTotal: number;
  grandTotal: number;
};

// Emergency fund has no equivalent "old_savings_bf"-style legacy figure in the schema,
// so there is only a current-year position here, not a three-tier breakdown.
export type EmergencyPositionSummary = {
  currentYearTotal: number;
};

export type AnnualFinancialReportData = {
  year: number;
  generatedAt: string;
  rows: AnnualReportRow[];
  yearTotal: AnnualReportTotal;
  savingsPosition: SavingsPositionSummary;
  emergencyPosition: EmergencyPositionSummary;
  // The first month in the year with any monthly_savings record, or null if the year has
  // none at all yet. null also means no brought-forward row was added (nothing to base
  // it on).
  anchorMonth: string | null;
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
    throw new Error("You do not have permission to generate financial reports.");
  }

  return { supabase, userId: user.id };
}

export async function generateFinancialReport(month: string): Promise<FinancialReportData> {
  const normalizedMonth = normalizeMonth(month);
  const { supabase, userId } = await ensureAdminAccess();

  // Backfill this month's row for every active member in every branch first, same as the
  // monthly PDF report - otherwise totalSubs/totalEmergencyContributions silently exclude
  // any branch whose sheet nobody has opened for this month yet. Skipped for a future month.
  const { data: branchList, error: branchesError } = await supabase.from("branches").select("id");
  if (branchesError) throw branchesError;

  if (isMonthUpToDate(normalizedMonth)) {
    await Promise.all(
      (branchList ?? []).map((branch) => ensureMonthRowsForBranch(supabase, branch.id, normalizedMonth, userId))
    );
  }

  // Heal carry-forward values for every branch unconditionally - this only corrects rows
  // that already exist and never creates new ones, so it is safe to run for any month
  // (past, current, or future) without the isMonthUpToDate guard.
  await Promise.all((branchList ?? []).map((branch) => healBranchCarryForward(supabase, branch.id)));

  const startDate = `${normalizedMonth}-01`;
  const [year, monthNumber] = normalizedMonth.split("-").map(Number);
  const endDate = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);

  const [monthlySavingsResult, emergencyContributionsResult, venturesResult, businessTransactionsResult] =
    await Promise.all([
      supabase.from("monthly_savings").select("subs").eq("month", normalizedMonth),
      supabase.from("emergency_contributions").select("emerg_subs, withdrawal").eq("month", normalizedMonth),
      supabase.from("business_ventures").select("id, name").eq("active", true).order("name", { ascending: true }),
      supabase
        .from("business_transactions")
        .select("venture_id, transaction_type, amount")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate),
    ]);

  if (monthlySavingsResult.error) throw monthlySavingsResult.error;
  if (emergencyContributionsResult.error) throw emergencyContributionsResult.error;
  if (venturesResult.error) throw venturesResult.error;
  if (businessTransactionsResult.error) throw businessTransactionsResult.error;

  const totalSubs = (monthlySavingsResult.data ?? []).reduce(
    (sum, row) => sum + toNumber(row.subs),
    0
  );

  const totalEmergencyContributions = (emergencyContributionsResult.data ?? []).reduce(
    (sum, row) => sum + toNumber(row.emerg_subs),
    0
  );

  const totalWithdrawals = (emergencyContributionsResult.data ?? []).reduce(
    (sum, row) => sum + toNumber(row.withdrawal),
    0
  );

  const ventureMap = new Map<string, VentureFinancialSummary>();

  for (const venture of venturesResult.data ?? []) {
    ventureMap.set(venture.id, {
      ventureId: venture.id,
      ventureName: venture.name,
      totalIncome: 0,
      fuel: 0,
      driverPayment: 0,
      maintenance: 0,
      otherExpense: 0,
      totalExpenses: 0,
      netProfit: 0,
    });
  }

  for (const transaction of businessTransactionsResult.data ?? []) {
    const venture = ventureMap.get(transaction.venture_id);
    if (!venture) continue;

    const amount = toNumber(transaction.amount);

    if (transaction.transaction_type === "income") {
      venture.totalIncome += amount;
    }

    if (transaction.transaction_type === "fuel") {
      venture.fuel += amount;
    }

    if (transaction.transaction_type === "driver_payment") {
      venture.driverPayment += amount;
    }

    if (transaction.transaction_type === "maintenance") {
      venture.maintenance += amount;
    }

    if (transaction.transaction_type === "other_expense") {
      venture.otherExpense += amount;
    }
  }

  for (const venture of ventureMap.values()) {
    venture.totalExpenses = venture.fuel + venture.driverPayment + venture.maintenance + venture.otherExpense;
    venture.netProfit = venture.totalIncome - venture.totalExpenses;
  }

  const businessSummaries = Array.from(ventureMap.values()).sort((left, right) =>
    left.ventureName.localeCompare(right.ventureName, undefined, { sensitivity: "base" })
  );

  const businessTotals = businessSummaries.reduce(
    (totals, venture) => {
      totals.totalIncome += venture.totalIncome;
      totals.fuel += venture.fuel;
      totals.driverPayment += venture.driverPayment;
      totals.maintenance += venture.maintenance;
      totals.otherExpense += venture.otherExpense;
      totals.totalExpenses += venture.totalExpenses;
      totals.netProfit += venture.netProfit;
      return totals;
    },
    {
      totalIncome: 0,
      fuel: 0,
      driverPayment: 0,
      maintenance: 0,
      otherExpense: 0,
      totalExpenses: 0,
      netProfit: 0,
    }
  );

  const savingsSummary = {
    totalSubs,
    totalEmergencyContributions,
    totalWithdrawals,
    netPosition: totalSubs + totalEmergencyContributions - totalWithdrawals,
  };

  const totalBusinessIncome = businessTotals.totalIncome;
  const totalBusinessExpenses = businessTotals.totalExpenses;

  const overallPosition = {
    totalInflow: totalSubs + totalEmergencyContributions + totalBusinessIncome,
    totalOutflow: totalWithdrawals + totalBusinessExpenses,
    netAssociationPosition: totalSubs + totalEmergencyContributions + totalBusinessIncome - totalWithdrawals - totalBusinessExpenses,
  };

  return {
    month: normalizedMonth,
    monthLabel: formatMonthLabel(normalizedMonth),
    generatedAt: new Date().toISOString(),
    savingsSummary,
    businessSummaries,
    businessTotals,
    overallPosition,
  };
}

export async function generateAnnualReport(year: number): Promise<AnnualFinancialReportData> {
  const safeYear = Number.isFinite(year) ? Math.trunc(year) : new Date().getFullYear();
  const { supabase } = await ensureAdminAccess();

  const monthEntries = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1;
    const month = `${safeYear}-${String(monthNumber).padStart(2, "0")}`;
    return { month, monthLabel: formatMonthLabel(month) };
  });

  const yearStart = monthEntries[0].month;
  const yearEnd = monthEntries[monthEntries.length - 1].month;

  // Read-only: find the first month this year that actually has a monthly_savings row
  // for anyone, anywhere. Deliberately never calls ensureMonthRowsForBranch/
  // generateFinancialReport for months before this - doing so would backfill
  // zero-value rows (old_savings_bf and previous_balance_bf both 0, since there is no
  // earlier row to carry from) and permanently corrupt the real carry-forward chain
  // once the true anchor month is reached. This is exactly what would otherwise happen
  // for 2026, where the association only started digitizing sheets partway into the
  // year - January-June have no records at all, on purpose.
  const { data: earliestRow, error: earliestRowError } = await supabase
    .from("monthly_savings")
    .select("month")
    .gte("month", yearStart)
    .lte("month", yearEnd)
    .order("month", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (earliestRowError) throw earliestRowError;

  const anchorMonth = earliestRow?.month ?? null;
  const noRecordMonths = anchorMonth ? monthEntries.filter((entry) => entry.month < anchorMonth) : [];
  const trackedMonths = anchorMonth ? monthEntries.filter((entry) => entry.month >= anchorMonth) : monthEntries;

  const rows: AnnualReportRow[] = [];

  // priorYearsTotal (old_savings_bf) and broughtForwardSavings/broughtForwardEmergency
  // (previous_balance_bf / previous_emerg_bf) are read from the anchor month regardless
  // of whether there's an actual gap to display - they're what feed the Savings/
  // Emergency Position summaries below even in a normal, fully-tracked year.
  let priorYearsTotal = 0;
  let broughtForwardSavings = 0;
  let broughtForwardEmergency = 0;

  if (anchorMonth) {
    const { data: activeMembers, error: activeMembersError } = await supabase
      .from("members")
      .select("id")
      .eq("status", "active");
    if (activeMembersError) throw activeMembersError;

    const activeMemberIds = (activeMembers ?? []).map((member) => member.id);

    const [anchorSavingsResult, anchorEmergencyResult] = await Promise.all([
      supabase
        .from("monthly_savings")
        .select("member_id, old_savings_bf, previous_balance_bf")
        .eq("month", anchorMonth)
        .in("member_id", activeMemberIds),
      supabase
        .from("emergency_contributions")
        .select("member_id, previous_emerg_bf")
        .eq("month", anchorMonth)
        .in("member_id", activeMemberIds),
    ]);

    if (anchorSavingsResult.error) throw anchorSavingsResult.error;
    if (anchorEmergencyResult.error) throw anchorEmergencyResult.error;

    priorYearsTotal = (anchorSavingsResult.data ?? []).reduce(
      (sum, row) => sum + toNumber(row.old_savings_bf),
      0
    );
    broughtForwardSavings = (anchorSavingsResult.data ?? []).reduce(
      (sum, row) => sum + toNumber(row.previous_balance_bf),
      0
    );
    broughtForwardEmergency = (anchorEmergencyResult.data ?? []).reduce(
      (sum, row) => sum + toNumber(row.previous_emerg_bf),
      0
    );
  }

  // Collapse the no-record stretch (if any) into a single row, per branch decision -
  // rather than 6 blank-looking monthly rows for Jan-Jun. Business venture figures for
  // that stretch are real sums (business_transactions carry their own date and don't
  // depend on a sheet ever being opened), not backfilled like the savings/emergency
  // figures would have been.
  if (noRecordMonths.length > 0 && anchorMonth) {
    const gapStartDate = `${noRecordMonths[0].month}-01`;
    const [anchorYear, anchorMonthNum] = anchorMonth.split("-").map(Number);
    const gapEndDate = new Date(Date.UTC(anchorYear, anchorMonthNum - 1, 0)).toISOString().slice(0, 10);

    const businessTransactionsResult = await supabase
      .from("business_transactions")
      .select("transaction_type, amount")
      .gte("transaction_date", gapStartDate)
      .lte("transaction_date", gapEndDate);

    if (businessTransactionsResult.error) throw businessTransactionsResult.error;

    let gapBusinessIncome = 0;
    let gapBusinessExpenses = 0;
    for (const transaction of businessTransactionsResult.data ?? []) {
      const amount = toNumber(transaction.amount);
      if (transaction.transaction_type === "income") {
        gapBusinessIncome += amount;
      } else {
        gapBusinessExpenses += amount;
      }
    }

    const firstLabel = noRecordMonths[0].monthLabel;
    const lastLabel = noRecordMonths[noRecordMonths.length - 1].monthLabel;
    const gapLabel = noRecordMonths.length === 1 ? firstLabel : `${firstLabel} - ${lastLabel}`;

    rows.push({
      month: `${safeYear}-BF`,
      monthLabel: `Brought Forward (${gapLabel})`,
      isBroughtForward: true,
      totalSubs: broughtForwardSavings,
      totalEmergencyContributions: broughtForwardEmergency,
      totalWithdrawals: 0,
      businessIncome: gapBusinessIncome,
      businessExpenses: gapBusinessExpenses,
      netPosition: broughtForwardSavings + broughtForwardEmergency + gapBusinessIncome - gapBusinessExpenses,
    });
  }

  for (const monthEntry of trackedMonths) {
    const monthReport = await generateFinancialReport(monthEntry.month);

    rows.push({
      month: monthEntry.month,
      monthLabel: monthEntry.monthLabel,
      totalSubs: monthReport.savingsSummary.totalSubs,
      totalEmergencyContributions: monthReport.savingsSummary.totalEmergencyContributions,
      totalWithdrawals: monthReport.savingsSummary.totalWithdrawals,
      businessIncome: monthReport.businessTotals.totalIncome,
      businessExpenses: monthReport.businessTotals.totalExpenses,
      netPosition:
        monthReport.savingsSummary.totalSubs +
        monthReport.savingsSummary.totalEmergencyContributions -
        monthReport.savingsSummary.totalWithdrawals +
        monthReport.businessTotals.totalIncome -
        monthReport.businessTotals.totalExpenses,
    });
  }

  const yearTotal = rows.reduce<AnnualReportTotal>(
    (totals, row) => {
      totals.totalSubs += row.totalSubs;
      totals.totalEmergencyContributions += row.totalEmergencyContributions;
      totals.totalWithdrawals += row.totalWithdrawals;
      totals.businessIncome += row.businessIncome;
      totals.businessExpenses += row.businessExpenses;
      totals.netPosition += row.netPosition;
      return totals;
    },
    {
      month: "TOTAL",
      monthLabel: "Year Total",
      totalSubs: 0,
      totalEmergencyContributions: 0,
      totalWithdrawals: 0,
      businessIncome: 0,
      businessExpenses: 0,
      netPosition: 0,
    }
  );

  // trackedMonths rows are exactly rows.slice() minus the optional brought-forward row -
  // reuse the same filter rather than re-deriving indices.
  const trackedRows = rows.filter((row) => !row.isBroughtForward);
  const trackedSubsTotal = trackedRows.reduce((sum, row) => sum + row.totalSubs, 0);
  const trackedEmergencyTotal = trackedRows.reduce((sum, row) => sum + row.totalEmergencyContributions, 0);
  const trackedWithdrawalsTotal = trackedRows.reduce((sum, row) => sum + row.totalWithdrawals, 0);

  const currentYearSavingsTotal = broughtForwardSavings + trackedSubsTotal;

  const savingsPosition: SavingsPositionSummary = {
    priorYearsTotal,
    currentYearTotal: currentYearSavingsTotal,
    grandTotal: priorYearsTotal + currentYearSavingsTotal,
  };

  const emergencyPosition: EmergencyPositionSummary = {
    currentYearTotal: broughtForwardEmergency + trackedEmergencyTotal - trackedWithdrawalsTotal,
  };

  return {
    year: safeYear,
    generatedAt: new Date().toISOString(),
    rows,
    yearTotal,
    savingsPosition,
    emergencyPosition,
    anchorMonth,
  };
}
