import { createClient } from "@/lib/supabase/server";

function formatKsh(value: number) {
  return `KSH ${new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function MemberDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, member_id, full_name, branch_id")
    .eq("auth_id", user.id)
    .single();

  const branchId = member?.branch_id;

  const { data: branch } = branchId
    ? await supabase.from("branches").select("name").eq("id", branchId).single()
    : { data: null };

  const memberId = member?.id;

  const [monthlyTotalsResult, latestBalanceResult, funeralTotalsResult, recentMonthlyResult] = memberId
    ? await Promise.all([
        supabase.from("monthly_contributions").select("amount").eq("member_id", memberId),
        supabase
          .from("monthly_contributions")
          .select("running_balance")
          .eq("member_id", memberId)
          .order("entry_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("funeral_contributions").select("amount").eq("member_id", memberId),
        supabase
          .from("monthly_contributions")
          .select("id, entry_date, amount")
          .eq("member_id", memberId)
          .order("entry_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5),
      ])
    : [
        { data: [] as Array<{ amount: number | string | null }> },
        { data: null as { running_balance: number | string | null } | null },
        { data: [] as Array<{ amount: number | string | null }> },
        { data: [] as Array<{ id: string; entry_date: string; amount: number | string | null }> },
      ];

  const totalMonthlyContributions = (monthlyTotalsResult.data ?? []).reduce(
    (sum, row) => sum + toNumber(row.amount),
    0
  );
  const currentBalance = toNumber(latestBalanceResult.data?.running_balance ?? 0);
  const totalFuneralContributions = (funeralTotalsResult.data ?? []).reduce(
    (sum, row) => sum + toNumber(row.amount),
    0
  );

  const recentContributions = recentMonthlyResult.data ?? [];

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          Member Dashboard
        </h1>
        <p className="mt-4 text-lg">Welcome, {member?.full_name ?? "Member"}.</p>
        <p className="mt-2 text-base sm:text-lg">
          Branch: {branch?.name ?? "Your branch"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Member ID: {member?.member_id ?? "Not assigned"}
        </p>
        <p className="mt-4 max-w-3xl text-base leading-7 sm:text-lg">
          Your contribution history and welfare records will appear here.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-xl border border-[#1d3a8a]/20 bg-[#0f1729] px-5 py-5 text-white shadow-sm">
            <p className="text-sm font-semibold text-slate-200">Total Contributions to Date</p>
            <p className="mt-5 text-3xl font-bold tracking-tight text-[#c9a227]">{formatKsh(totalMonthlyContributions)}</p>
            <p className="mt-2 text-xs text-slate-300">Monthly contributions recorded so far</p>
          </article>

          <article className="rounded-xl border border-[#1d3a8a]/20 bg-[#0f1729] px-5 py-5 text-white shadow-sm">
            <p className="text-sm font-semibold text-slate-200">Current Balance</p>
            <p className="mt-5 text-3xl font-bold tracking-tight text-[#c9a227]">{formatKsh(currentBalance)}</p>
            <p className="mt-2 text-xs text-slate-300">Latest running balance from passbook</p>
          </article>

          <article className="rounded-xl border border-[#1d3a8a]/20 bg-[#0f1729] px-5 py-5 text-white shadow-sm">
            <p className="text-sm font-semibold text-slate-200">Total Funeral Contributions</p>
            <p className="mt-5 text-3xl font-bold tracking-tight text-[#c9a227]">{formatKsh(totalFuneralContributions)}</p>
            <p className="mt-2 text-xs text-slate-300">Funeral fund contributions to date</p>
          </article>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Recent Contributions</h2>

          {recentContributions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-6">
              <p className="text-base text-slate-600">No contributions recorded yet.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentContributions.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">{formatDate(entry.entry_date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1d3a8a] sm:px-6">{formatKsh(toNumber(entry.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
