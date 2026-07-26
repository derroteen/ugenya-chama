import { createClient } from "@/lib/supabase/server";
import { openMonthForBranch, updateMonthlyEntryFromForm } from "../actions";
import SheetFilters from "./SheetFilters";

type PageProps = {
  params: Promise<{ branchId: string }> | { branchId: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function toNumber(value: number | string) {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatKsh(value: number) {
  return `KSH ${new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export default async function MainAdminBranchSheetPage({ params, searchParams }: PageProps) {
  const { branchId } = await Promise.resolve(params);
  const resolvedParams = await Promise.resolve(searchParams ?? {});
  const month = getParamValue(resolvedParams.month).trim() || currentMonth();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "main_admin" && profile.role !== "superadmin")) {
    return null;
  }

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .order("name", { ascending: true });

  const branchOptions = branches ?? [];
  const selectedBranch = branchOptions.find((branch) => branch.id === branchId);

  if (!selectedBranch) {
    return (
      <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
        <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <h1 className="text-2xl font-semibold text-[#0f1729]">Invalid Branch</h1>
          <p className="mt-3 text-slate-600">The selected branch does not exist.</p>
        </section>
      </main>
    );
  }

  const rows = await openMonthForBranch(branchId, month);

  const totals = rows.reduce(
    (acc, row) => {
      acc.subs += toNumber(row.subs);
      acc.cumulativeSaving += toNumber(row.cumulativeSaving);
      acc.emergSubs += toNumber(row.emergSubs);
      acc.withdrawal += toNumber(row.withdrawal);
      acc.emergencyBalance += toNumber(row.emergencyBalance);
      return acc;
    },
    { subs: 0, cumulativeSaving: 0, emergSubs: 0, withdrawal: 0, emergencyBalance: 0 }
  );

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-[95rem] rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Monthly Sheets</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          {selectedBranch.name} Contribution Sheet
        </h1>

        <SheetFilters branches={branchOptions} currentBranchId={branchId} month={month} />

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">No.</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">KBG Shares B/F</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Old Savings B/F</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Previous Balance B/F</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Subs</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Cumulative Saving</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Previous Emerg B/F</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Emerg Subs</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Cumulative Emerg Fund</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Withdrawal</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Emergency Balance</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-sm text-slate-500">
                      No active members in this branch.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const formId = `row-${row.monthlySavingsId}`;
                    return (
                      <tr key={row.monthlySavingsId} className="hover:bg-slate-50/70 align-top">
                        <td className="px-3 py-3 text-sm text-slate-700">{index + 1}</td>
                        <td className="px-3 py-3 text-sm font-medium text-[#0f1729]">
                          <div>{row.memberName}</div>
                          <div className="text-xs text-slate-500">{row.memberNo}</div>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">{formatKsh(row.kbgSharesBf)}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{formatKsh(row.oldSavingsBf)}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{formatKsh(row.previousBalanceBf)}</td>

                        <td className="px-3 py-3 text-sm text-slate-700">
                          <input
                            form={formId}
                            name="subs"
                            type="number"
                            min={0}
                            step="0.01"
                            defaultValue={row.subs}
                            className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(row.cumulativeSaving)}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{formatKsh(row.previousEmergBf)}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          <input
                            form={formId}
                            name="emergSubs"
                            type="number"
                            min={0}
                            step="0.01"
                            defaultValue={row.emergSubs}
                            className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(row.cumulativeEmergFund)}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          <input
                            form={formId}
                            name="withdrawal"
                            type="number"
                            min={0}
                            step="0.01"
                            defaultValue={row.withdrawal}
                            className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(row.emergencyBalance)}</td>
                        <td className="px-3 py-3 text-right text-sm">
                          <form id={formId} action={updateMonthlyEntryFromForm}>
                            <input type="hidden" name="monthlySavingsId" value={row.monthlySavingsId} />
                            <input type="hidden" name="emergencyContributionId" value={row.emergencyContributionId} />
                          </form>
                          <button
                            form={formId}
                            type="submit"
                            className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#16306f]"
                          >
                            Save Row
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              <tfoot className="bg-[#f8fbff]">
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Totals
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(totals.subs)}</td>
                  <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(totals.cumulativeSaving)}</td>
                  <td className="px-3 py-3" />
                  <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(totals.emergSubs)}</td>
                  <td className="px-3 py-3" />
                  <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(totals.withdrawal)}</td>
                  <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(totals.emergencyBalance)}</td>
                  <td className="px-3 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
