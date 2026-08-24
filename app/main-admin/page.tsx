import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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

function firstDayOfMonthIso() {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return first.toISOString().slice(0, 10);
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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

function getJoinedBranchName(
  branchRelation: { name: string } | Array<{ name: string }> | null | undefined
) {
  if (!branchRelation) return null;
  if (Array.isArray(branchRelation)) {
    return branchRelation[0]?.name ?? null;
  }
  return branchRelation.name ?? null;
}

export default async function MainAdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const monthStart = firstDayOfMonthIso();
  const today = todayIso();
  const currentMonth = currentMonthKey();

  const [activeMembersResult, newMembersResult, monthlyContributionsResult, emergencyContributionsResult, recentMembersResult] =
    await Promise.all([
      supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .gte("created_at", `${monthStart}T00:00:00.000Z`)
        .lte("created_at", `${today}T23:59:59.999Z`),
      supabase
        .from("monthly_contributions")
        .select("amount")
        .gte("entry_date", monthStart)
        .lte("entry_date", today),
      supabase
        .from("emergency_contributions")
        .select("emerg_subs")
        .eq("month", currentMonth),
      supabase
        .from("members")
        .select("id, full_name, member_id, created_at, branches(name)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const totalMonthlyContributions = (monthlyContributionsResult.data ?? []).reduce(
    (sum, row) => sum + toNumber(row.amount),
    0
  );

  const totalEmergencyContributions = (emergencyContributionsResult.data ?? []).reduce(
    (sum, row) => sum + toNumber(row.emerg_subs),
    0
  );

  const recentMembers = (recentMembersResult.data ?? []) as Array<{
    id: string;
    full_name: string;
    member_id: string;
    created_at: string;
    branches: { name: string } | Array<{ name: string }> | null;
  }>;

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          Main Admin Dashboard
        </h1>
        <p className="mt-4 text-lg">
          Welcome, {profile?.full_name ?? "Main Admin"}.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-[#1d3a8a]/20 bg-[#0f1729] px-5 py-5 text-white shadow-sm">
            <p className="text-sm font-semibold text-slate-200">Total Members</p>
            <p className="mt-5 text-4xl font-bold tracking-tight text-[#c9a227]">{activeMembersResult.count ?? 0}</p>
            <p className="mt-2 text-xs text-slate-300">Active members across all branches</p>
          </article>

          <article className="rounded-xl border border-[#1d3a8a]/20 bg-[#0f1729] px-5 py-5 text-white shadow-sm">
            <p className="text-sm font-semibold text-slate-200">New This Month</p>
            <p className="mt-5 text-4xl font-bold tracking-tight text-[#c9a227]">{newMembersResult.count ?? 0}</p>
            <p className="mt-2 text-xs text-slate-300">New registrations this month</p>
          </article>

          <article className="rounded-xl border border-[#1d3a8a]/20 bg-[#0f1729] px-5 py-5 text-white shadow-sm">
            <p className="text-sm font-semibold text-slate-200">Monthly Contributions</p>
            <p className="mt-5 text-3xl font-bold tracking-tight text-[#c9a227]">{formatKsh(totalMonthlyContributions)}</p>
            <p className="mt-2 text-xs text-slate-300">Total this month across all branches</p>
          </article>

          <article className="rounded-xl border border-[#1d3a8a]/20 bg-[#0f1729] px-5 py-5 text-white shadow-sm">
            <p className="text-sm font-semibold text-slate-200">Total Emergency Fund</p>
            <p className="mt-5 text-3xl font-bold tracking-tight text-[#c9a227]">{formatKsh(totalEmergencyContributions)}</p>
            <p className="mt-2 text-xs text-slate-300">Emergency fund total this month</p>
          </article>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Quick Actions</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Link
              href="/main-admin/members"
              className="rounded-xl border border-[#1d3a8a]/20 bg-[#f8fbff] px-5 py-5 transition hover:border-[#1d3a8a]/40 hover:shadow-sm"
            >
              <p className="text-lg font-semibold text-[#0f1729]">View All Members</p>
              <p className="mt-1 text-sm text-slate-600">Browse members across every branch.</p>
            </Link>

            <Link
              href="/main-admin/funeral-sheets"
              className="rounded-xl border border-[#1d3a8a]/20 bg-[#f8fbff] px-5 py-5 transition hover:border-[#1d3a8a]/40 hover:shadow-sm"
            >
              <p className="text-lg font-semibold text-[#0f1729]">Funeral / Emergency Collections</p>
              <p className="mt-1 text-sm text-slate-600">
                Browse one-off funeral or emergency-event collections across all branches.
              </p>
            </Link>

            <Link
              href="/main-admin/business"
              className="rounded-xl border border-[#1d3a8a]/20 bg-[#f8fbff] px-5 py-5 transition hover:border-[#1d3a8a]/40 hover:shadow-sm"
            >
              <p className="text-lg font-semibold text-[#0f1729]">Business Activities</p>
              <p className="mt-1 text-sm text-slate-600">
                Track income and expenses for association-run ventures like the van hire business.
              </p>
            </Link>

            {profile && (profile.role === "main_admin" || profile.role === "superadmin") ? (
              <>
                <Link
                  href="/main-admin/reports"
                  className="rounded-xl border border-[#1d3a8a]/20 bg-[#f8fbff] px-5 py-5 transition hover:border-[#1d3a8a]/40 hover:shadow-sm"
                >
                  <p className="text-lg font-semibold text-[#0f1729]">Generate Monthly PDF Report</p>
                  <p className="mt-1 text-sm text-slate-600">Download a combined all-branches monthly report in PDF format.</p>
                </Link>

                <Link
                  href="/main-admin/financial-report"
                  className="rounded-xl border border-[#1d3a8a]/20 bg-[#f8fbff] px-5 py-5 transition hover:border-[#1d3a8a]/40 hover:shadow-sm"
                >
                  <p className="text-lg font-semibold text-[#0f1729]">Generate Financial Summary PDF</p>
                  <p className="mt-1 text-sm text-slate-600">Review savings, emergency fund, and business performance in one monthly report.</p>
                </Link>
              </>
            ) : null}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Recent Activity</h2>

          {recentMembers.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-6">
              <p className="text-base text-slate-600">No members have been added yet.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Member ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-sm font-medium text-[#0f1729] sm:px-6">
                        <Link
                          href={`/main-admin/members/${member.id}`}
                          className="underline-offset-2 transition hover:text-[#1d3a8a] hover:underline"
                        >
                          {member.full_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#1d3a8a] sm:px-6">{member.member_id}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">{getJoinedBranchName(member.branches) ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">{formatDate(member.created_at)}</td>
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
