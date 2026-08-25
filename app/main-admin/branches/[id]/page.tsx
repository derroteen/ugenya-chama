import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DownloadBlankSheetButton from "./DownloadBlankSheetButton";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function statusBadgeClasses(status: string) {
  if (status === "active") {
    return "border border-emerald-300 bg-emerald-50 text-emerald-800";
  }
  if (status === "suspended") {
    return "border border-amber-300 bg-amber-50 text-amber-800";
  }
  return "border border-slate-300 bg-slate-100 text-slate-700";
}

function statusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "suspended") return "Suspended";
  return "Inactive";
}

export default async function MainAdminBranchDetailsPage({ params }: PageProps) {
  const { id } = await Promise.resolve(params);
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

  const { data: branch } = await supabase
    .from("branches")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!branch) {
    return (
      <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)]">
            Branch not found
          </h1>
          <p className="mt-4 text-base sm:text-lg">The selected branch could not be found.</p>
          <Link
            href="/main-admin/branches"
            className="mt-6 inline-flex items-center rounded-lg bg-[#1d3a8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f]"
          >
            Back to Branches
          </Link>
        </section>
      </main>
    );
  }

  const { data: members } = await supabase
    .from("members")
    .select("id, member_id, full_name, phone, status, sheet_order")
    .eq("branch_id", branch.id)
    .eq("status", "active")
    .order("sheet_order", { ascending: true, nullsFirst: false })
    .order("full_name", { ascending: true });

  const currentMonth = currentMonthKey();

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Branch</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              {branch.name}
            </h1>
          </div>

          <Link
            href="/main-admin/branches"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0f1729] transition hover:bg-slate-50"
          >
            ← All Branches
          </Link>
        </div>

        <div className="mt-8 space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
            <h2 className="text-2xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Quick Actions</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Link
                href={`/main-admin/sheets/${branch.id}?month=${currentMonth}`}
                className="rounded-2xl border border-[#1d3a8a]/20 bg-[#1d3a8a] p-5 text-left text-white shadow-sm transition hover:bg-[#16306f]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#dbeafe]">Monthly</p>
                <p className="mt-3 text-xl font-semibold">Open Contribution Sheet</p>
                <p className="mt-2 text-sm text-slate-200">Update this branch&apos;s savings and emergency entries.</p>
              </Link>

              <Link
                href={`/main-admin/members/new?branchId=${branch.id}`}
                className="rounded-2xl border border-[#1d3a8a]/20 bg-white p-5 text-left text-[#0f1729] shadow-sm transition hover:border-[#1d3a8a]/35 hover:bg-slate-50"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1d3a8a]">Members</p>
                <p className="mt-3 text-xl font-semibold">Add New Member</p>
                <p className="mt-2 text-sm text-slate-600">Create a member directly for this branch.</p>
              </Link>

              <Link
                href={`/main-admin/funeral-sheets/${branch.id}`}
                className="rounded-2xl border border-[#1d3a8a]/20 bg-white p-5 text-left text-[#0f1729] shadow-sm transition hover:border-[#1d3a8a]/35 hover:bg-slate-50"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1d3a8a]">Welfare</p>
                <p className="mt-3 text-xl font-semibold">Funeral Collection Sheet</p>
                <p className="mt-2 text-sm text-slate-600">Record one-off funeral or emergency collections.</p>
              </Link>

              <div className="rounded-2xl border border-[#1d3a8a]/20 bg-white p-5 text-left text-[#0f1729] shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1d3a8a]">Documents</p>
                <p className="mt-3 text-xl font-semibold">Download Blank Sheet</p>
                <div className="mt-4">
                  <DownloadBlankSheetButton branchId={branch.id} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Members</h2>
            </div>

            {(!members || members.length === 0) ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                <p className="text-base font-medium text-slate-700">No active members have been added to this branch yet.</p>
                <p className="mt-2 text-sm text-slate-500">Members will appear here once they are registered.</p>
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">No.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Member ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Full Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">{member.sheet_order ?? "—"}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#1d3a8a] sm:px-6">{member.member_id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#0f1729] sm:px-6">{member.full_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">{member.phone}</td>
                        <td className="px-4 py-3 text-sm sm:px-6">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses(member.status)}`}>
                            {statusLabel(member.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <Link
                            href={`/main-admin/members/${member.id}`}
                            className="inline-flex items-center rounded-md border border-[#1d3a8a]/20 bg-white px-3 py-1.5 text-sm font-semibold text-[#1d3a8a] transition hover:border-[#1d3a8a]/35 hover:bg-[#eef2ff]"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
