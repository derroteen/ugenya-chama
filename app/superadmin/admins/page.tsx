import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type AdminRole = "superadmin" | "main_admin";

interface AdminProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: AdminRole;
  branch_id: string | null;
  created_at: string;
  branches: { name: string } | Array<{ name: string }> | null;
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

function roleBadgeClasses(role: AdminRole) {
  if (role === "superadmin") {
    return "border border-amber-300 bg-amber-50 text-amber-900";
  }
  return "border border-[#1d3a8a]/30 bg-[#eaf1ff] text-[#1d3a8a]";
}

function roleLabel(role: AdminRole) {
  if (role === "superadmin") return "Superadmin";
  return "Main Admin";
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

export default async function SuperadminAdminsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, branch_id, created_at, branches(name)")
    .in("role", ["superadmin", "main_admin"])
    .order("role", { ascending: true })
    .order("full_name", { ascending: true });

  const rows = (admins ?? []) as AdminProfileRow[];

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Administration</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              Admin Management
            </h1>
          </div>
          <Link
            href="/superadmin/admins/new"
            className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2"
          >
            Add Admin
          </Link>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
          <div
            className="w-full overflow-x-auto"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
          >
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500 sm:px-6">
                      No admin accounts found.
                    </td>
                  </tr>
                ) : (
                  rows.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-4 text-sm font-medium text-[#0f1729] sm:px-6">
                        {admin.full_name ?? "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700 sm:px-6">
                        {admin.email ?? "-"}
                      </td>
                      <td className="px-4 py-4 text-sm sm:px-6">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeClasses(
                            admin.role
                          )}`}
                        >
                          {roleLabel(admin.role)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700 sm:px-6">
                        {getJoinedBranchName(admin.branches) ?? "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700 sm:px-6">
                        {formatDate(admin.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
