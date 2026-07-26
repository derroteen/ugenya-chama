import Link from "next/link";
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

function firstDayOfMonthIso() {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return first.toISOString().slice(0, 10);
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

export default async function BranchAdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, branch_id")
    .eq("id", user.id)
    .single();

  const branchId = profile?.branch_id;

  const { data: branch } = branchId
    ? await supabase.from("branches").select("name").eq("id", branchId).single()
    : { data: null };

  const monthStart = firstDayOfMonthIso();
  const today = todayIso();

  const [
    activeMembersCountResult,
    newThisMonthCountResult,
    monthlyContributionsSumResult,
    funeralContributionsSumResult,
    recentMembersResult,
  ] = branchId
    ? await Promise.all([
        supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("branch_id", branchId)
          .eq("status", "active"),
        supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("branch_id", branchId)
          .gte("created_at", `${monthStart}T00:00:00.000Z`)
          .lte("created_at", `${today}T23:59:59.999Z`),
        supabase
          .from("monthly_contributions")
          .select("amount")
          .eq("branch_id", branchId)
          .gte("entry_date", monthStart)
          .lte("entry_date", today),
        supabase
          .from("funeral_contributions")
          .select("amount")
          .eq("branch_id", branchId)
          .gte("entry_date", monthStart)
          .lte("entry_date", today),
        supabase
          .from("members")
          .select("id, member_id, full_name, created_at")
          .eq("branch_id", branchId)
          .order("created_at", { ascending: false })
          .limit(5),
      ])
    : [
        { count: 0 },
        { count: 0 },
        { data: [] as Array<{ amount: number | string | null }> },
        { data: [] as Array<{ amount: number | string | null }> },
        { data: [] as Array<{ id: string; member_id: string; full_name: string; created_at: string }> },
      ];

  const activeMembers = activeMembersCountResult.count ?? 0;
  const newThisMonth = newThisMonthCountResult.count ?? 0;

  const monthlyContributionTotal = (monthlyContributionsSumResult.data ?? []).reduce(
    (total, row) => total + toNumber(row.amount),
    0
  );

  const funeralContributionTotal = (funeralContributionsSumResult.data ?? []).reduce(
    (total, row) => total + toNumber(row.amount),
    0
  );

  const recentMembers = recentMembersResult.data ?? [];

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          Branch Admin Dashboard
        </h1>
        <p className="mt-4 text-lg">
          Welcome, {profile?.full_name ?? "Branch Admin"}.
        </p>
        <p className="mt-2 text-base sm:text-lg">
          Branch: {branch?.name ?? "Your branch"}
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-[#1d3a8a]/20 bg-[#0f1729] px-5 py-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-200">Total Members</p>
              <span className="text-[#c9a227]" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <circle cx="9" cy="7" r="3" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 19a6 6 0 0112 0" />
                  <circle cx="17" cy="8" r="2.5" />
                </svg>
              </span>
            </div>
            <p className="mt-5 text-4xl font-bold tracking-tight text-[#c9a227]">{activeMembers}</p>
            <p className="mt-2 text-xs text-slate-300">Active members in this branch</p>
          </article>

          <article className="rounded-xl border border-[#1d3a8a]/20 bg-[#0f1729] px-5 py-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-200">New This Month</p>
              <span className="text-[#c9a227]" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
                </svg>
              </span>
            </div>
            <p className="mt-5 text-4xl font-bold tracking-tight text-[#c9a227]">{newThisMonth}</p>
            <p className="mt-2 text-xs text-slate-300">Members added this month</p>
          </article>

          <article className="rounded-xl border border-[#1d3a8a]/20 bg-[#0f1729] px-5 py-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-200">Monthly Contributions</p>
              <span className="text-[#c9a227]" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22M5 6h10a3 3 0 010 6H9a3 3 0 000 6h10" />
                </svg>
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-[#c9a227]">{formatKsh(monthlyContributionTotal)}</p>
            <p className="mt-2 text-xs text-slate-300">Total for current month</p>
          </article>

          <article className="rounded-xl border border-[#1d3a8a]/20 bg-[#0f1729] px-5 py-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-200">Funeral Fund</p>
              <span className="text-[#c9a227]" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M6 20v-8l6-4 6 4v8" />
                </svg>
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-[#c9a227]">{formatKsh(funeralContributionTotal)}</p>
            <p className="mt-2 text-xs text-slate-300">Total for current month</p>
          </article>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Quick Actions</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/branch-admin/members/new"
              className="rounded-xl border border-[#1d3a8a]/20 bg-[#f8fbff] px-5 py-5 transition hover:border-[#1d3a8a]/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
            >
              <p className="text-lg font-semibold text-[#0f1729]">Add Member</p>
              <p className="mt-1 text-sm text-slate-600">Register a new member under this branch.</p>
            </Link>

            <Link
              href="/branch-admin/members"
              className="rounded-xl border border-[#1d3a8a]/20 bg-[#f8fbff] px-5 py-5 transition hover:border-[#1d3a8a]/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
            >
              <p className="text-lg font-semibold text-[#0f1729]">View Members</p>
              <p className="mt-1 text-sm text-slate-600">Browse and manage current member records.</p>
            </Link>

            <Link
              href="#"
              className="rounded-xl border border-[#1d3a8a]/20 bg-[#f8fbff] px-5 py-5 transition hover:border-[#1d3a8a]/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
            >
              <p className="text-lg font-semibold text-[#0f1729]">Record Contribution</p>
              <p className="mt-1 text-sm text-slate-600">Capture member monthly and funeral contributions.</p>
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Recently Added Members</h2>

          {recentMembers.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-6">
              <p className="text-base text-slate-600">No members have been added in this branch yet.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Member ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-sm font-medium text-[#0f1729] sm:px-6">
                        <Link
                          href={`/branch-admin/members/${member.id}`}
                          className="underline-offset-2 transition hover:text-[#1d3a8a] hover:underline"
                        >
                          {member.full_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#1d3a8a] sm:px-6">{member.member_id}</td>
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
