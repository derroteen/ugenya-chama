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

export type AnnualFinancialReportData = {
  year: number;
  generatedAt: string;
  rows: AnnualReportRow[];
  yearTotal: AnnualReportTotal;
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
    return {
      month: `${safeYear}-${String(monthNumber).padStart(2, "0")}`,
      monthLabel: formatMonthLabel(`${safeYear}-${String(monthNumber).padStart(2, "0")}`),
    };
  });

  const rows: AnnualReportRow[] = [];

  for (const monthEntry of monthEntries) {
    const monthReport = await generateFinancialReport(monthEntry.month);

    const row: AnnualReportRow = {
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
    };

    rows.push(row);
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

  return {
    year: safeYear,
    generatedAt: new Date().toISOString(),
    rows,
    yearTotal,
  };
}
