import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import InstallPWAButton from "@/components/InstallPWAButton";

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

function formatMonthLabel(month: string) {
  if (!month) return "All months";
  const date = new Date(`${month}-01T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return month;

  return new Intl.DateTimeFormat("en-KE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
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

  const unreadAnnouncementsCount = member
    ? await (async () => {
        const { data: visibleAnnouncements, error: visibleError } = await supabase
          .from("announcements")
          .select("id, target_type, announcement_branches(branch_id)");

        if (visibleError || !visibleAnnouncements || visibleAnnouncements.length === 0) {
          return 0;
        }

        const allowedAnnouncementIds = new Set<string>();
        for (const announcement of visibleAnnouncements) {
          const targetType = announcement.target_type;
          const branchLinks = Array.isArray(announcement.announcement_branches)
            ? announcement.announcement_branches
            : announcement.announcement_branches
              ? [announcement.announcement_branches]
              : [];

          const isVisible = targetType === "all" || branchLinks.some((branch) => branch?.branch_id === branchId);
          if (isVisible) {
            allowedAnnouncementIds.add(announcement.id);
          }
        }

        if (allowedAnnouncementIds.size === 0) {
          return 0;
        }

        const { data: readRows, error: readError } = await supabase
          .from("announcement_reads")
          .select("announcement_id")
          .eq("member_id", member.id)
          .in("announcement_id", Array.from(allowedAnnouncementIds));

        if (readError) {
          console.error("Member dashboard announcement unread count error:", readError);
          return 0;
        }

        const readIds = new Set((readRows ?? []).map((row) => row.announcement_id));
        return Array.from(allowedAnnouncementIds).filter((id) => !readIds.has(id)).length;
      })()
    : 0;

  const { data: branch } = branchId
    ? await supabase.from("branches").select("name").eq("id", branchId).single()
    : { data: null };

  const memberId = member?.id;

  const [monthlyTotalsResult, latestBalanceResult, funeralTotalsResult, recentMonthlyResult] = memberId
    ? await Promise.all([
        supabase.from("monthly_savings").select("subs").eq("member_id", memberId),
        supabase
          .from("monthly_savings")
          .select("cumulative_saving")
          .eq("member_id", memberId)
          .order("month", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("funeral_collections").select("amount").eq("member_id", memberId),
        supabase
          .from("monthly_savings")
          .select("id, month, subs")
          .eq("member_id", memberId)
          .order("month", { ascending: false })
          .limit(5),
      ])
    : [
        { data: [] as Array<{ subs: number | string | null }> },
        { data: null as { cumulative_saving: number | string | null } | null },
        { data: [] as Array<{ amount: number | string | null }> },
        { data: [] as Array<{ id: string; month: string; subs: number | string | null }> },
      ];

  const totalMonthlyContributions = (monthlyTotalsResult.data ?? []).reduce(
    (sum, row) => sum + toNumber(row.subs),
    0
  );
  const currentBalance = toNumber(latestBalanceResult.data?.cumulative_saving ?? 0);
  const totalFuneralContributions = (funeralTotalsResult.data ?? []).reduce(
    (sum, row) => sum + toNumber(row.amount),
    0
  );

  const recentContributions = recentMonthlyResult.data ?? [];

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              Member Dashboard
            </h1>
            <p className="mt-4 text-lg">Welcome, {member?.full_name ?? "Member"}.</p>
            <p className="mt-2 text-base sm:text-lg">
              Branch: {branch?.name ?? "Your branch"}
            </p>
          </div>
          <InstallPWAButton />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Member ID: {member?.member_id ?? "Not assigned"}
        </p>
        <p className="mt-4 max-w-3xl text-base leading-7 sm:text-lg">
          Your contribution history and welfare records will appear here.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/member/passbook"
            className="inline-flex items-center justify-center rounded-lg border border-[#1d3a8a]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#0f1729] transition hover:border-[#1d3a8a]/35 hover:bg-slate-50"
          >
            Passbook
          </Link>
          <Link
            href="/member/announcements"
            className="relative inline-flex items-center justify-center rounded-lg border border-[#1d3a8a]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#0f1729] transition hover:border-[#1d3a8a]/35 hover:bg-slate-50"
          >
            Announcements
            {unreadAnnouncementsCount > 0 ? (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#c9a227] px-1.5 py-0.5 text-[10px] font-bold text-[#0f1729]">
                {unreadAnnouncementsCount}
              </span>
            ) : null}
          </Link>
        </div>

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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Month</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Subs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recentContributions.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">{formatMonthLabel(entry.month)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1d3a8a] sm:px-6">{formatKsh(toNumber(entry.subs))}</td>
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
